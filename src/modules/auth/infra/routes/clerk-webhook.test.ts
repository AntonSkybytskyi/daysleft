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

  it("returns 200 and ignores a non-user event type without touching the repository", async () => {
    const repository = fakeRepository();
    const payload = JSON.stringify({ type: "session.created", data: { id: "sess_1" } });
    const verify = vi.fn().mockReturnValue({ valid: true, event: JSON.parse(payload) });

    const result = await handleClerkWebhook({ headers: validHeaders, rawBody: payload }, { webhookSecret, repository, verify });

    expect(result.status).toBe(200);
    expect(repository.upsertById).not.toHaveBeenCalled();
    expect(repository.findByEmail).not.toHaveBeenCalled();
  });

  it("returns 200 and ignores a user.deleted event without crashing on the missing email_addresses shape", async () => {
    const repository = fakeRepository();
    const payload = JSON.stringify({ type: "user.deleted", data: { id: "user_1", deleted: true } });
    const verify = vi.fn().mockReturnValue({ valid: true, event: JSON.parse(payload) });

    const result = await handleClerkWebhook({ headers: validHeaders, rawBody: payload }, { webhookSecret, repository, verify });

    expect(result.status).toBe(200);
    expect(repository.upsertById).not.toHaveBeenCalled();
  });

  it("does not crash when an email entry carries a null verification (guards the field, doesn't count it as verified)", async () => {
    const repository = fakeRepository();
    const payload = JSON.stringify({
      type: "user.created",
      data: {
        id: "user_1",
        email_addresses: [{ email_address: "traveler@example.test", verification: null }],
      },
    });
    const verify = vi.fn().mockReturnValue({ valid: true, event: JSON.parse(payload) });

    const result = await handleClerkWebhook({ headers: validHeaders, rawBody: payload }, { webhookSecret, repository, verify });

    expect(result).toEqual({
      status: 422,
      body: { code: "auth.email_required", message: "A verified email is required to create or link an account." },
    });
  });

  it("dedupes a redelivery with the same svix-id — a single upsert, a 200 on the second delivery too", async () => {
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

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(repository.upsertById).toHaveBeenCalledTimes(1);
  });

  it("does not serve the dedupe cache to a redelivery whose signature fails verification", async () => {
    const repository = fakeRepository();
    const verify = vi.fn().mockReturnValue({ valid: true, event: JSON.parse(eventPayload()) });
    const dedupeStore = createInMemoryDedupeStore();

    await handleClerkWebhook(
      { headers: validHeaders, rawBody: eventPayload() },
      { webhookSecret, repository, verify, dedupeStore },
    );

    // An attacker replaying the same svix-id with a body/signature that no longer verifies must
    // not get the first delivery's cached (and PII-bearing) success body served back unauthenticated.
    const forgedVerify = vi.fn().mockReturnValue({ valid: false });
    const replayed = await handleClerkWebhook(
      { headers: validHeaders, rawBody: eventPayload() },
      { webhookSecret, repository, verify: forgedVerify, dedupeStore },
    );

    expect(replayed.status).toBe(401);
    expect(replayed.body).toEqual({
      code: "auth.webhook_invalid_signature",
      message: "Webhook signature verification failed.",
    });
  });

  it("caches only a status marker, never the user's id/email, so a replayed svix-id can't be used to read PII", async () => {
    const repository = fakeRepository();
    const verify = vi.fn().mockReturnValue({ valid: true, event: JSON.parse(eventPayload()) });
    const dedupeStore = createInMemoryDedupeStore();

    await handleClerkWebhook(
      { headers: validHeaders, rawBody: eventPayload() },
      { webhookSecret, repository, verify, dedupeStore },
    );
    const second = await handleClerkWebhook(
      { headers: validHeaders, rawBody: eventPayload() },
      { webhookSecret, repository, verify, dedupeStore },
    );

    expect(JSON.stringify(second.body)).not.toContain("traveler@example.test");
    expect(JSON.stringify(second.body)).not.toContain("user_1");
  });

  it("invalidates any stored linked-identity mapping for the event's identity on user.created/user.updated", async () => {
    const repository = fakeRepository();
    const linkedIdentities = { invalidate: vi.fn().mockResolvedValue(undefined) };
    const verify = vi.fn().mockReturnValue({ valid: true, event: JSON.parse(eventPayload({ id: "user_second_identity" })) });

    await handleClerkWebhook(
      { headers: validHeaders, rawBody: eventPayload({ id: "user_second_identity" }) },
      { webhookSecret, repository, verify, linkedIdentities: linkedIdentities as never },
    );

    // A stored mapping is only ever a snapshot of the email that justified it — if the
    // identity's Clerk profile changed (this event proves it did), the old mapping must not
    // survive to silently misattribute the identity to whichever account it used to resolve to.
    expect(linkedIdentities.invalidate).toHaveBeenCalledWith("user_second_identity");
  });

  it("does not invalidate anything for an ignored non-user event type", async () => {
    const repository = fakeRepository();
    const linkedIdentities = { invalidate: vi.fn().mockResolvedValue(undefined) };
    const payload = JSON.stringify({ type: "session.created", data: { id: "sess_1" } });
    const verify = vi.fn().mockReturnValue({ valid: true, event: JSON.parse(payload) });

    await handleClerkWebhook(
      { headers: validHeaders, rawBody: payload },
      { webhookSecret, repository, verify, linkedIdentities: linkedIdentities as never },
    );

    expect(linkedIdentities.invalidate).not.toHaveBeenCalled();
  });

  it("bounds the in-memory dedupe store instead of retaining every svix-id for the process lifetime", async () => {
    const dedupeStore = createInMemoryDedupeStore({ maxEntries: 2 });
    dedupeStore.set("a", { status: 200, body: { deduped: true } });
    dedupeStore.set("b", { status: 200, body: { deduped: true } });
    dedupeStore.set("c", { status: 200, body: { deduped: true } });

    expect(dedupeStore.get("a")).toBeUndefined();
    expect(dedupeStore.get("b")).toBeDefined();
    expect(dedupeStore.get("c")).toBeDefined();
  });
});
