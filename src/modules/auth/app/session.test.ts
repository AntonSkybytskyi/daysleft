import { describe, expect, it, vi } from "vitest";
import type { LinkedIdentitiesRepository } from "../infra/linked-identities-repository";
import type { UsersRepository } from "../infra/users-repository";
import { getSessionUser, type SessionDeps } from "./session";

function fakeRepository(overrides?: Partial<UsersRepository>): UsersRepository {
  return {
    findByEmail: vi.fn().mockResolvedValue(null),
    findById: vi.fn().mockResolvedValue(null),
    upsertById: vi.fn(),
    ...overrides,
  } as unknown as UsersRepository;
}

function fakeLinkedIdentities(overrides?: Partial<LinkedIdentitiesRepository>): LinkedIdentitiesRepository {
  const store = new Map<string, string>();
  return {
    findCanonicalUserId: vi.fn().mockImplementation(async (id: string) => store.get(id) ?? null),
    link: vi.fn().mockImplementation(async (id: string, canonicalId: string) => {
      store.set(id, canonicalId);
    }),
    ...overrides,
  } as unknown as LinkedIdentitiesRepository;
}

describe("getSessionUser", () => {
  it("resolves to unauthenticated with no data leaked when there is no session", async () => {
    const repository = fakeRepository();
    const deps: SessionDeps = {
      getAuthUserId: vi.fn().mockResolvedValue(null),
      repository,
      fetchClerkUser: vi.fn(),
      linkedIdentities: fakeLinkedIdentities(),
    };

    const result = await getSessionUser(deps);

    expect(result).toEqual({ authenticated: false });
    expect(repository.findById).not.toHaveBeenCalled();
  });

  it("resolves to the local user row when the shadow row already exists", async () => {
    const user = { id: "user_1", email: "traveler@example.test", createdAt: new Date(), updatedAt: new Date() };
    const repository = fakeRepository({ findById: vi.fn().mockResolvedValue(user) });
    const fetchClerkUser = vi.fn();
    const deps: SessionDeps = {
      getAuthUserId: vi.fn().mockResolvedValue("user_1"),
      repository,
      fetchClerkUser,
      linkedIdentities: fakeLinkedIdentities(),
    };

    const result = await getSessionUser(deps);

    expect(result).toEqual({ authenticated: true, user });
    expect(fetchClerkUser).not.toHaveBeenCalled();
  });

  it("creates the shadow row on the spot when the webhook hasn't landed yet", async () => {
    const createdUser = { id: "user_1", email: "traveler@example.test", createdAt: new Date(), updatedAt: new Date() };
    const repository = fakeRepository({
      findById: vi.fn().mockResolvedValue(null),
      upsertById: vi.fn().mockResolvedValue({ kind: "ok", user: createdUser }),
    });
    const deps: SessionDeps = {
      getAuthUserId: vi.fn().mockResolvedValue("user_1"),
      repository,
      fetchClerkUser: vi.fn().mockResolvedValue({ id: "user_1", verifiedEmail: "traveler@example.test" }),
      linkedIdentities: fakeLinkedIdentities(),
    };

    const result = await getSessionUser(deps);

    expect(result).toEqual({ authenticated: true, user: createdUser, linked: false });
    expect(repository.upsertById).toHaveBeenCalledWith({ id: "user_1", email: "traveler@example.test" });
  });

  it("marks the session linked when the create-or-fetch fallback matches an existing account by email", async () => {
    const existingByEmail = { id: "user_via_google", email: "traveler@example.test", createdAt: new Date(), updatedAt: new Date() };
    const repository = fakeRepository({
      findById: vi.fn().mockResolvedValue(null),
      findByEmail: vi.fn().mockResolvedValue(existingByEmail),
      upsertById: vi.fn().mockResolvedValue({ kind: "ok", user: existingByEmail }),
    });
    const deps: SessionDeps = {
      getAuthUserId: vi.fn().mockResolvedValue("user_via_magic_link"),
      repository,
      fetchClerkUser: vi.fn().mockResolvedValue({ id: "user_via_magic_link", verifiedEmail: "traveler@example.test" }),
      linkedIdentities: fakeLinkedIdentities(),
    };

    const result = await getSessionUser(deps);

    expect(result).toEqual({ authenticated: true, user: existingByEmail, linked: true });
  });

  it("persists the linked identity via the repository, so it's durable across instances/restarts", async () => {
    const existingByEmail = { id: "user_via_google", email: "traveler@example.test", createdAt: new Date(), updatedAt: new Date() };
    const repository = fakeRepository({
      findById: vi.fn().mockResolvedValue(null),
      findByEmail: vi.fn().mockResolvedValue(existingByEmail),
      upsertById: vi.fn().mockResolvedValue({ kind: "ok", user: existingByEmail }),
    });
    const linkedIdentities = fakeLinkedIdentities();
    const deps: SessionDeps = {
      getAuthUserId: vi.fn().mockResolvedValue("user_via_magic_link"),
      repository,
      fetchClerkUser: vi.fn().mockResolvedValue({ id: "user_via_magic_link", verifiedEmail: "traveler@example.test" }),
      linkedIdentities,
    };

    await getSessionUser(deps);

    expect(linkedIdentities.link).toHaveBeenCalledWith("user_via_magic_link", "user_via_google");
  });

  it("clears the linked banner on a repeat request for the same linked identity, with only one Clerk fetch total", async () => {
    const existingByEmail = { id: "user_via_google", email: "traveler@example.test", createdAt: new Date(), updatedAt: new Date() };
    const findById = vi.fn().mockImplementation(async (id: string) => (id === "user_via_google" ? existingByEmail : null));
    const repository = fakeRepository({
      findById,
      findByEmail: vi.fn().mockResolvedValue(existingByEmail),
      upsertById: vi.fn().mockResolvedValue({ kind: "ok", user: existingByEmail }),
    });
    const fetchClerkUser = vi.fn().mockResolvedValue({ id: "user_via_magic_link", verifiedEmail: "traveler@example.test" });
    const deps: SessionDeps = {
      getAuthUserId: vi.fn().mockResolvedValue("user_via_magic_link"),
      repository,
      fetchClerkUser,
      linkedIdentities: fakeLinkedIdentities(),
    };

    const first = await getSessionUser(deps);
    const second = await getSessionUser(deps);

    expect(first).toEqual({ authenticated: true, user: existingByEmail, linked: true });
    expect(second).toEqual({ authenticated: true, user: existingByEmail, linked: false });
    expect(fetchClerkUser).toHaveBeenCalledTimes(1);
  });

  it("reports email_conflict (not a generic session-invalid) when upsertById finds the identity's email owned by a different account", async () => {
    const repository = fakeRepository({
      findById: vi.fn().mockResolvedValue(null),
      findByEmail: vi.fn().mockResolvedValue(null),
      upsertById: vi.fn().mockResolvedValue({ kind: "email_conflict" }),
    });
    const deps: SessionDeps = {
      getAuthUserId: vi.fn().mockResolvedValue("user_new_identity"),
      repository,
      fetchClerkUser: vi.fn().mockResolvedValue({ id: "user_new_identity", verifiedEmail: "traveler@example.test" }),
      linkedIdentities: fakeLinkedIdentities(),
    };

    const result = await getSessionUser(deps);

    expect(result).toEqual({ authenticated: false, reason: "email_conflict" });
  });

  it("resolves to unauthenticated with no data leaked when Clerk has no verified email for this user", async () => {
    const repository = fakeRepository();
    const deps: SessionDeps = {
      getAuthUserId: vi.fn().mockResolvedValue("user_1"),
      repository,
      fetchClerkUser: vi.fn().mockResolvedValue({ id: "user_1", verifiedEmail: null }),
      linkedIdentities: fakeLinkedIdentities(),
    };

    const result = await getSessionUser(deps);

    expect(result).toEqual({ authenticated: false, reason: "email_required" });
    expect(repository.upsertById).not.toHaveBeenCalled();
  });
});
