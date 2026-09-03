import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readFileSync } from "node:fs";
import path from "node:path";
import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as schema from "@/db/schema";
import { handleClerkWebhook } from "@/modules/auth/infra/routes/clerk-webhook";
import { UsersRepository } from "@/modules/auth/infra/users-repository";
import { getSessionUser, type SessionDeps } from "@/modules/auth/app/session";
import { getDashboard, DASHBOARD_PATH } from "@/modules/dashboard/app/get-dashboard";
import { logout } from "@/modules/auth/app/logout";
import LoginPage from "@/app/login/page";
import SsoCallbackPage from "@/app/sso-callback/page";

let mockHeaders: Record<string, string> = {};
vi.mock("next/headers", () => ({
  headers: () => ({ get: (name: string) => mockHeaders[name] ?? null }),
}));

let capturedLoginReturnTo: string | undefined;
vi.mock("@/modules/auth/ui/login/LoginContainer", () => ({
  LoginContainer: (props: { returnTo: string }) => {
    capturedLoginReturnTo = props.returnTo;
    return null;
  },
}));

let capturedSsoReturnTo: string | undefined;
vi.mock("@/modules/auth/ui/sso-callback/SsoCallbackContainer", () => ({
  SsoCallbackContainer: (props: { returnTo: string }) => {
    capturedSsoReturnTo = props.returnTo;
    return null;
  },
}));


const webhookSecret = "whsec_test_secret";

async function verifyOk(rawBody: string) {
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

const noopLinkedIdentities = {
  findCanonicalUserId: () => Promise.resolve(null),
  invalidate: () => Promise.resolve(undefined),
};

describe("QG-1 security scenarios (sad.md §10)", () => {
  it("(a) two sign-ins with the same verified email via different methods resolve to one account", async () => {
    const sharedEmail = "traveler@example.test";

    const first = await handleClerkWebhook(
      { headers, rawBody: eventPayload("user_via_google", sharedEmail) },
      {
        webhookSecret,
        repository,
        verify: () => verifyOk(eventPayload("user_via_google", sharedEmail)),
        linkedIdentities: noopLinkedIdentities,
      },
    );
    const second = await handleClerkWebhook(
      { headers, rawBody: eventPayload("user_via_magic_link", sharedEmail) },
      {
        webhookSecret,
        repository,
        verify: () => verifyOk(eventPayload("user_via_magic_link", sharedEmail)),
        linkedIdentities: noopLinkedIdentities,
      },
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
      linkedIdentities: { findCanonicalUserId: vi.fn().mockResolvedValue(null), link: vi.fn() } as never,
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

  describe("(c) an untrusted return_to is rejected before it reaches Clerk", () => {
    beforeEach(() => {
      mockHeaders = { host: "daysleft.example", "x-forwarded-proto": "https" };
      capturedLoginReturnTo = undefined;
      capturedSsoReturnTo = undefined;
    });

    const attackVectors: Array<[string, string]> = [
      ["off-origin URL", "https://evil.example/steal-session"],
      ["path-traversal to a protocol-relative //host path", "/..//evil.example/x"],
      ["raw protocol-relative //host path", "//evil.example"],
    ];

    it.each(attackVectors)(
      "LoginPage passes a safe returnTo to LoginContainer for a %s value",
      (_label, attackerReturnTo) => {
        render(<LoginPage searchParams={{ return_to: attackerReturnTo }} />);

        expect(capturedLoginReturnTo).toBe(DASHBOARD_PATH);
        expect(capturedLoginReturnTo).not.toContain("evil.example");
      },
    );

    it.each(attackVectors)(
      "SsoCallbackPage passes a safe returnTo to SsoCallbackContainer for a %s value",
      (_label, attackerReturnTo) => {
        render(<SsoCallbackPage searchParams={{ return_to: attackerReturnTo }} />);

        expect(capturedSsoReturnTo).toBe(DASHBOARD_PATH);
        expect(capturedSsoReturnTo).not.toContain("evil.example");
      },
    );
  });
});
