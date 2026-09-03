import { describe, expect, it, vi } from "vitest";
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

describe("getSessionUser", () => {
  it("resolves to unauthenticated with no data leaked when there is no session", async () => {
    const repository = fakeRepository();
    const deps: SessionDeps = {
      getAuthUserId: vi.fn().mockResolvedValue(null),
      repository,
      fetchClerkUser: vi.fn(),
    };

    const result = await getSessionUser(deps);

    expect(result).toEqual({ authenticated: false });
    expect(repository.findById).not.toHaveBeenCalled();
  });

  it("resolves to the local user row when the shadow row already exists", async () => {
    const user = { id: "user_1", email: "traveler@example.test", createdAt: new Date(), updatedAt: new Date() };
    const repository = fakeRepository({ findById: vi.fn().mockResolvedValue(user) });
    const fetchClerkUser = vi.fn();
    const deps: SessionDeps = { getAuthUserId: vi.fn().mockResolvedValue("user_1"), repository, fetchClerkUser };

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
    };

    const result = await getSessionUser(deps);

    expect(result).toEqual({ authenticated: true, user: createdUser });
    expect(repository.upsertById).toHaveBeenCalledWith({ id: "user_1", email: "traveler@example.test" });
  });

  it("resolves to unauthenticated with no data leaked when Clerk has no verified email for this user", async () => {
    const repository = fakeRepository();
    const deps: SessionDeps = {
      getAuthUserId: vi.fn().mockResolvedValue("user_1"),
      repository,
      fetchClerkUser: vi.fn().mockResolvedValue({ id: "user_1", verifiedEmail: null }),
    };

    const result = await getSessionUser(deps);

    expect(result).toEqual({ authenticated: false, reason: "email_required" });
    expect(repository.upsertById).not.toHaveBeenCalled();
  });
});
