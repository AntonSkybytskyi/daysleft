import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as schema from "@/db/schema";
import { handleClerkWebhook } from "@/modules/auth/infra/routes/clerk-webhook";
import { LinkedIdentitiesRepository } from "@/modules/auth/infra/linked-identities-repository";
import { UsersRepository } from "@/modules/auth/infra/users-repository";
import { getSessionUser, type SessionDeps } from "@/modules/auth/app/session";

async function verifyOk(rawBody: string) {
  return { valid: true as const, event: JSON.parse(rawBody) };
}

function eventPayload(id: string, email: string) {
  return JSON.stringify({
    type: "user.updated",
    data: {
      id,
      email_addresses: [{ email_address: email, verification: { status: "verified" } }],
    },
  });
}

const headers = { "svix-id": "msg", "svix-timestamp": "1", "svix-signature": "sig" };
const webhookSecret = "whsec_test_secret";

let client: PGlite;
let users: UsersRepository;
let linkedIdentities: LinkedIdentitiesRepository;

beforeEach(async () => {
  client = new PGlite();
  const db = drizzle(client, { schema });
  for (const file of ["0000_panoramic_paladin.sql", "0001_add_linked_identities.sql"]) {
    const migrationSql = readFileSync(path.resolve(__dirname, "../../../drizzle", file), "utf-8");
    await client.exec(migrationSql);
  }
  users = new UsersRepository(db);
  linkedIdentities = new LinkedIdentitiesRepository(db);
});

afterEach(async () => {
  await client.close();
});

// Proves the webhook's invalidation scope and getSessionUser's read of it actually meet
// against the same database — round 4/5 found the two sides only ever tested in isolation,
// letting a scoping bug ship unnoticed by either suite.
describe("linked-identity mapping: webhook invalidation meets session read", () => {
  it("survives an unrelated profile edit on the canonical account — no re-derive, no extra Clerk fetch", async () => {
    const sharedEmail = "traveler@example.test";
    await users.upsertById({ id: "user_canonical", email: sharedEmail });
    await linkedIdentities.link("user_second_identity", "user_canonical");

    const webhookResult = await handleClerkWebhook(
      { headers, rawBody: eventPayload("user_canonical", sharedEmail) },
      { webhookSecret, repository: users, linkedIdentities, verify: () => verifyOk(eventPayload("user_canonical", sharedEmail)) },
    );
    expect(webhookResult.status).toBe(200);

    const fetchClerkUser = vi.fn();
    const deps: SessionDeps = {
      getAuthUserId: async () => "user_second_identity",
      repository: users,
      linkedIdentities,
      fetchClerkUser,
    };

    const result = await getSessionUser(deps);

    expect(result).toEqual({ authenticated: true, user: expect.objectContaining({ email: sharedEmail }), linked: false });
    expect(fetchClerkUser).not.toHaveBeenCalled();
  });

  it("forces a re-derive once the canonical account's own verified email actually changes", async () => {
    const oldEmail = "traveler@example.test";
    const newEmail = "traveler-new@example.test";
    await users.upsertById({ id: "user_canonical", email: oldEmail });
    await linkedIdentities.link("user_second_identity", "user_canonical");

    const webhookResult = await handleClerkWebhook(
      { headers, rawBody: eventPayload("user_canonical", newEmail) },
      { webhookSecret, repository: users, linkedIdentities, verify: () => verifyOk(eventPayload("user_canonical", newEmail)) },
    );
    expect(webhookResult.status).toBe(200);

    const fetchClerkUser = vi.fn().mockResolvedValue({ id: "user_second_identity", verifiedEmail: newEmail });
    const deps: SessionDeps = {
      getAuthUserId: async () => "user_second_identity",
      repository: users,
      linkedIdentities,
      fetchClerkUser,
    };

    const result = await getSessionUser(deps);

    // The stale mapping is gone, so getSessionUser falls through to a fresh Clerk fetch
    // instead of silently resolving to the (now-outdated) canonical row.
    expect(fetchClerkUser).toHaveBeenCalled();
    expect(result).toMatchObject({ authenticated: true });
  });

  it("stops misattributing a linked identity to its old canonical account once its own verified email drifts away from it", async () => {
    const canonicalEmail = "traveler@example.test";
    const driftedEmail = "changed@example.test";
    await users.upsertById({ id: "user_canonical", email: canonicalEmail });
    await linkedIdentities.link("user_second_identity", "user_canonical");

    const webhookResult = await handleClerkWebhook(
      { headers, rawBody: eventPayload("user_second_identity", driftedEmail) },
      {
        webhookSecret,
        repository: users,
        linkedIdentities,
        verify: () => verifyOk(eventPayload("user_second_identity", driftedEmail)),
      },
    );
    expect(webhookResult.status).toBe(200);

    const fetchClerkUser = vi.fn();
    const deps: SessionDeps = {
      getAuthUserId: async () => "user_second_identity",
      repository: users,
      linkedIdentities,
      fetchClerkUser,
    };

    const result = await getSessionUser(deps);

    // The webhook's own upsert already gave the identity its own shadow row under its new
    // email (resolveAccountLinking finds no other account at driftedEmail), so getSessionUser
    // resolves it directly — the point is what it did NOT do: resolve to the stale canonical
    // account under the old mapping, which the pre-fix unconditional-never-cleared mapping
    // would have kept doing forever.
    expect(result).toEqual({
      authenticated: true,
      user: expect.objectContaining({ id: "user_second_identity", email: driftedEmail }),
    });
    expect(await linkedIdentities.findCanonicalUserId("user_second_identity")).toBeNull();
  });
});
