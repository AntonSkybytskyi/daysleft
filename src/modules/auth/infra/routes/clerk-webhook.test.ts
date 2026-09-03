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

function fakeLinkedIdentities() {
  return { invalidate: vi.fn().mockResolvedValue(undefined), findCanonicalUserId: vi.fn().mockResolvedValue(null) };
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
      { webhookSecret, repository, verify, linkedIdentities: fakeLinkedIdentities() },
    );

    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({ id: "user_1", email: "traveler@example.test" });
  });

  it("returns 401 auth.webhook_invalid_signature on a bad Svix signature", async () => {
    const repository = fakeRepository();
    const verify = vi.fn().mockReturnValue({ valid: false });

    const result = await handleClerkWebhook(
      { headers: validHeaders, rawBody: eventPayload() },
      { webhookSecret, repository, verify, linkedIdentities: fakeLinkedIdentities() },
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
      { webhookSecret, repository, verify, linkedIdentities: fakeLinkedIdentities() },
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
      { webhookSecret, repository, verify, linkedIdentities: fakeLinkedIdentities() },
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

    const result = await handleClerkWebhook({ headers: validHeaders, rawBody: payload }, { webhookSecret, repository, verify, linkedIdentities: fakeLinkedIdentities() });

    expect(result.status).toBe(200);
    expect(repository.upsertById).not.toHaveBeenCalled();
    expect(repository.findByEmail).not.toHaveBeenCalled();
  });

  it("returns 200 and ignores a user.deleted event without crashing on the missing email_addresses shape", async () => {
    const repository = fakeRepository();
    const payload = JSON.stringify({ type: "user.deleted", data: { id: "user_1", deleted: true } });
    const verify = vi.fn().mockReturnValue({ valid: true, event: JSON.parse(payload) });

    const result = await handleClerkWebhook({ headers: validHeaders, rawBody: payload }, { webhookSecret, repository, verify, linkedIdentities: fakeLinkedIdentities() });

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

    const result = await handleClerkWebhook({ headers: validHeaders, rawBody: payload }, { webhookSecret, repository, verify, linkedIdentities: fakeLinkedIdentities() });

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
      { webhookSecret, repository, verify, dedupeStore, linkedIdentities: fakeLinkedIdentities() },
    );
    const second = await handleClerkWebhook(
      { headers: validHeaders, rawBody: eventPayload() },
      { webhookSecret, repository, verify, dedupeStore, linkedIdentities: fakeLinkedIdentities() },
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
      { webhookSecret, repository, verify, dedupeStore, linkedIdentities: fakeLinkedIdentities() },
    );

    // An attacker replaying the same svix-id with a body/signature that no longer verifies must
    // not get the first delivery's cached (and PII-bearing) success body served back unauthenticated.
    const forgedVerify = vi.fn().mockReturnValue({ valid: false });
    const replayed = await handleClerkWebhook(
      { headers: validHeaders, rawBody: eventPayload() },
      { webhookSecret, repository, verify: forgedVerify, dedupeStore, linkedIdentities: fakeLinkedIdentities() },
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
      { webhookSecret, repository, verify, dedupeStore, linkedIdentities: fakeLinkedIdentities() },
    );
    const second = await handleClerkWebhook(
      { headers: validHeaders, rawBody: eventPayload() },
      { webhookSecret, repository, verify, dedupeStore, linkedIdentities: fakeLinkedIdentities() },
    );

    expect(JSON.stringify(second.body)).not.toContain("traveler@example.test");
    expect(JSON.stringify(second.body)).not.toContain("user_1");
  });

  it("invalidates the mapping when the event's own stored email actually changed", async () => {
    const repository = fakeRepository({
      findById: vi.fn().mockResolvedValue({ id: "user_canonical", email: "old@example.test" }),
    });
    const linkedIdentities = { invalidate: vi.fn().mockResolvedValue(undefined), findCanonicalUserId: vi.fn().mockResolvedValue(null) };
    const payload = eventPayload({ id: "user_canonical", email: "new@example.test" });
    const verify = vi.fn().mockReturnValue({ valid: true, event: JSON.parse(payload) });

    await handleClerkWebhook(
      { headers: validHeaders, rawBody: payload },
      { webhookSecret, repository, verify, linkedIdentities: linkedIdentities as never },
    );

    // A stored mapping is only ever a snapshot of the email that justified it — if this
    // account's own verified email actually changed (this event proves it did, vs. what
    // repository.findById reports on record), any mapping resting on the old email must not
    // survive to silently misattribute an identity to it.
    expect(linkedIdentities.invalidate).toHaveBeenCalledWith("user_canonical");
  });

  it("does not invalidate anything when the event's email matches what's already on record (an unrelated profile edit)", async () => {
    const repository = fakeRepository({
      findById: vi.fn().mockResolvedValue({ id: "user_canonical", email: "traveler@example.test" }),
    });
    const linkedIdentities = { invalidate: vi.fn().mockResolvedValue(undefined), findCanonicalUserId: vi.fn().mockResolvedValue(null) };
    const payload = eventPayload({ id: "user_canonical", email: "traveler@example.test" });
    const verify = vi.fn().mockReturnValue({ valid: true, event: JSON.parse(payload) });

    await handleClerkWebhook(
      { headers: validHeaders, rawBody: payload },
      { webhookSecret, repository, verify, linkedIdentities: linkedIdentities as never },
    );

    // A display-name/avatar/metadata-only user.updated must not re-fire the "linked" banner or
    // cost an extra Clerk fetch on the next session read — see session.test.ts's pinned
    // "one Clerk fetch total" invariant.
    expect(linkedIdentities.invalidate).not.toHaveBeenCalled();
  });

  it("invalidates a linked identity's own mapping once its verified email no longer matches the canonical account it resolved to", async () => {
    const repository = fakeRepository({
      findById: vi.fn().mockImplementation(async (id: string) =>
        id === "user_canonical" ? { id: "user_canonical", email: "traveler@example.test" } : null,
      ),
    });
    const linkedIdentities = {
      invalidate: vi.fn().mockResolvedValue(undefined),
      findCanonicalUserId: vi.fn().mockResolvedValue("user_canonical"),
    };
    const payload = eventPayload({ id: "user_second_identity", email: "changed@example.test" });
    const verify = vi.fn().mockReturnValue({ valid: true, event: JSON.parse(payload) });

    await handleClerkWebhook(
      { headers: validHeaders, rawBody: payload },
      { webhookSecret, repository, verify, linkedIdentities: linkedIdentities as never },
    );

    // The identity's own record (there is none — only canonical accounts get a `users` row)
    // never changed, but its verified email has drifted from the canonical account it was
    // mapped to — the mapping's justification (same verified email) no longer holds.
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
