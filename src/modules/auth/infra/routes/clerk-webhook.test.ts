import { describe, expect, it, vi } from "vitest";
import type { UsersRepository } from "../users-repository";
import { createInMemoryDedupeStore, handleClerkWebhook } from "./clerk-webhook";

const webhookSecret = "whsec_test_secret";

function fakeRepository(overrides?: Partial<UsersRepository>): UsersRepository {
  return {
    findByEmail: vi.fn().mockResolvedValue(null),
    findById: vi.fn().mockResolvedValue(null),
    upsertById: vi.fn().mockResolvedValue({
      kind: "ok",
      user: { id: "user_1", email: "traveler@example.test", createdAt: new Date(), updatedAt: new Date() },
    }),
    ...overrides,
  } as unknown as UsersRepository;
}

function eventPayload(overrides?: { verified?: boolean; email?: string; id?: string }) {
  return JSON.stringify({
    type: "user.created",
    data: {
      id: overrides?.id ?? "user_1",
      email_addresses: [
        {
          email_address: overrides?.email ?? "traveler@example.test",
          verification: { status: overrides?.verified === false ? "unverified" : "verified" },
        },
      ],
    },
  });
}

const validHeaders = { "svix-id": "msg_1", "svix-timestamp": "1", "svix-signature": "v1,sig" };

describe("handleClerkWebhook", () => {
  it("returns 200 with the upserted user on a verified event with a valid signature", async () => {
    const repository = fakeRepository();
    const verify = vi.fn().mockReturnValue({ valid: true, event: JSON.parse(eventPayload()) });

    const result = await handleClerkWebhook(
      { headers: validHeaders, rawBody: eventPayload() },
      { webhookSecret, repository, verify },
    );

    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({ id: "user_1", email: "traveler@example.test" });
  });

  it("returns 401 auth.webhook_invalid_signature on a bad Svix signature", async () => {
    const repository = fakeRepository();
    const verify = vi.fn().mockReturnValue({ valid: false });

    const result = await handleClerkWebhook(
      { headers: validHeaders, rawBody: eventPayload() },
      { webhookSecret, repository, verify },
    );

    expect(result).toEqual({
      status: 401,
      body: { code: "auth.webhook_invalid_signature", message: "Webhook signature verification failed." },
    });
    expect(repository.upsertById).not.toHaveBeenCalled();
  });

  it("returns 422 auth.email_required when no verified email is present", async () => {
    const repository = fakeRepository();
    const payload = eventPayload({ verified: false });
    const verify = vi.fn().mockReturnValue({ valid: true, event: JSON.parse(payload) });

    const result = await handleClerkWebhook(
      { headers: validHeaders, rawBody: payload },
      { webhookSecret, repository, verify },
    );

    expect(result).toEqual({
      status: 422,
      body: { code: "auth.email_required", message: "A verified email is required to create or link an account." },
    });
    expect(repository.upsertById).not.toHaveBeenCalled();
  });

  it("returns 422 auth.email_conflict when the verified email is already linked to a different account", async () => {
    const repository = fakeRepository({
      upsertById: vi.fn().mockResolvedValue({ kind: "email_conflict" }),
    });
    const verify = vi.fn().mockReturnValue({ valid: true, event: JSON.parse(eventPayload()) });

    const result = await handleClerkWebhook(
      { headers: validHeaders, rawBody: eventPayload() },
      { webhookSecret, repository, verify },
    );

    expect(result).toEqual({
      status: 422,
      body: {
        code: "auth.email_conflict",
        message: "That email is already linked to a different account.",
      },
    });
  });

  it("dedupes a redelivery with the same svix-id — a single upsert, the same cached result returned twice", async () => {
    const repository = fakeRepository();
    const verify = vi.fn().mockReturnValue({ valid: true, event: JSON.parse(eventPayload()) });
    const dedupeStore = createInMemoryDedupeStore();

    const first = await handleClerkWebhook(
      { headers: validHeaders, rawBody: eventPayload() },
      { webhookSecret, repository, verify, dedupeStore },
    );
    const second = await handleClerkWebhook(
      { headers: validHeaders, rawBody: eventPayload() },
      { webhookSecret, repository, verify, dedupeStore },
    );

    expect(first).toEqual(second);
    expect(repository.upsertById).toHaveBeenCalledTimes(1);
  });
});
