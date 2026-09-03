import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as schema from "@/db/schema";
import { handleClerkWebhook } from "@/modules/auth/infra/routes/clerk-webhook";
import { UsersRepository } from "@/modules/auth/infra/users-repository";
import { getSessionUser, type SessionDeps } from "@/modules/auth/app/session";
import { getDashboard } from "@/modules/dashboard/app/get-dashboard";
import { logout } from "@/modules/auth/app/logout";
import { resolveReturnTo } from "@/modules/dashboard/app/return-to";

const webhookSecret = "whsec_test_secret";
const appOrigin = "https://daysleft.example";

function verifyOk(rawBody: string) {
  return { valid: true as const, event: JSON.parse(rawBody) };
}

function eventPayload(id: string, email: string) {
  return JSON.stringify({
    type: "user.created",
    data: {
      id,
      email_addresses: [{ email_address: email, verification: { status: "verified" } }],
    },
  });
}

const headers = { "svix-id": "msg", "svix-timestamp": "1", "svix-signature": "sig" };

let client: PGlite;
let repository: UsersRepository;

beforeEach(async () => {
  client = new PGlite();
  const db = drizzle(client, { schema });
  const migrationSql = readFileSync(
    path.resolve(__dirname, "../../../drizzle/0000_panoramic_paladin.sql"),
    "utf-8",
  );
  await client.exec(migrationSql);
  repository = new UsersRepository(db);
});

afterEach(async () => {
  await client.close();
});

describe("QG-1 security scenarios (sad.md §10)", () => {
  it("(a) two sign-ins with the same verified email via different methods resolve to one account", async () => {
    const sharedEmail = "traveler@example.test";

    const first = await handleClerkWebhook(
      { headers, rawBody: eventPayload("user_via_google", sharedEmail) },
      { webhookSecret, repository, verify: () => verifyOk(eventPayload("user_via_google", sharedEmail)) },
    );
    const second = await handleClerkWebhook(
      { headers, rawBody: eventPayload("user_via_magic_link", sharedEmail) },
      { webhookSecret, repository, verify: () => verifyOk(eventPayload("user_via_magic_link", sharedEmail)) },
    );

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect((second.body as { id: string }).id).toBe((first.body as { id: string }).id);

    const allById = await repository.findById((first.body as { id: string }).id);
    expect(allById).toMatchObject({ email: sharedEmail });
  });

  it("(b) a dashboard request after logout on the same session is denied", async () => {
    await repository.upsertById({ id: "user_1", email: "traveler@example.test" });

    let sessionActive = true;
    const sessionDeps: SessionDeps = {
      getAuthUserId: async () => (sessionActive ? "user_1" : null),
      repository,
      fetchClerkUser: vi.fn(),
    };

    const beforeLogout = await getDashboard(sessionDeps);
    expect(beforeLogout.status).toBe(200);

    const logoutResult = await logout({
      getSessionId: async () => "sess_1",
      revokeSession: async () => {
        sessionActive = false;
      },
    });
    expect(logoutResult).toEqual({ status: 204 });

    const afterLogout = await getDashboard(sessionDeps);
    expect(afterLogout.status).toBe(401);
    expect((afterLogout.body as { code: string }).code).toBe("auth.session_invalid");

    const sessionAfterLogout = await getSessionUser(sessionDeps);
    expect(sessionAfterLogout).toEqual({ authenticated: false });
  });

  it("(c) an off-origin return-to param is rejected in favor of the default dashboard destination", () => {
    const attackerReturnTo = "https://evil.example/steal-session";

    const resolved = resolveReturnTo(attackerReturnTo, appOrigin);

    expect(resolved).toBe("/dashboard");
    expect(resolved).not.toContain("evil.example");
  });
});
