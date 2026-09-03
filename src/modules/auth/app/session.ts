import { resolveAccountLinking } from "./account-linking";
import type { User, UsersRepository } from "../infra/users-repository";

export type SessionResult = { authenticated: true; user: User } | { authenticated: false };

export type SessionDeps = {
  getAuthUserId: () => Promise<string | null>;
  repository: UsersRepository;
  fetchClerkUser: (userId: string) => Promise<{ id: string; verifiedEmail: string | null }>;
};

export async function getSessionUser(deps: SessionDeps): Promise<SessionResult> {
  const userId = await deps.getAuthUserId();
  if (!userId) {
    return { authenticated: false };
  }

  const existing = await deps.repository.findById(userId);
  if (existing) {
    return { authenticated: true, user: existing };
  }

  const clerkUser = await deps.fetchClerkUser(userId);
  const matchedByEmail = clerkUser.verifiedEmail
    ? await deps.repository.findByEmail(clerkUser.verifiedEmail)
    : null;
  const decision = resolveAccountLinking(
    { clerkUserId: clerkUser.id, verifiedEmail: clerkUser.verifiedEmail },
    matchedByEmail,
  );

  if (decision.kind === "rejected") {
    return { authenticated: false };
  }

  const result = await deps.repository.upsertById({ id: decision.id, email: decision.email });
  if (result.kind === "email_conflict") {
    return { authenticated: false };
  }

  return { authenticated: true, user: result.user };
}
