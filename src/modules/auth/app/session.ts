import { resolveAccountLinking } from "./account-linking";
import type { User, UsersRepository } from "../infra/users-repository";

export type SessionResult =
  | { authenticated: true; user: User; linked?: boolean }
  | { authenticated: false; reason?: "email_required" | "email_conflict" };

export type SessionDeps = {
  getAuthUserId: () => Promise<string | null>;
  repository: UsersRepository;
  fetchClerkUser: (userId: string) => Promise<{ id: string; verifiedEmail: string | null }>;
  // Maps a Clerk identity id that linked-by-email onto the canonical local user id it resolved to.
  // The `users` table can only ever hold one row per email (upsertById rejects a second id
  // claiming an already-used email as email_conflict), so a second Clerk identity can't get its
  // own row — this in-memory map is the "equivalent marker" that lets a repeat request from that
  // same identity resolve locally instead of re-hitting Clerk's API and re-showing `linked: true`
  // forever. Defaults to a shared module-level map (persists for this server process's lifetime);
  // tests inject their own instance for isolation.
  linkedIdentities?: Map<string, string>;
};

const defaultLinkedIdentities = new Map<string, string>();

export async function getSessionUser(deps: SessionDeps): Promise<SessionResult> {
  const userId = await deps.getAuthUserId();
  if (!userId) {
    return { authenticated: false };
  }

  const existing = await deps.repository.findById(userId);
  if (existing) {
    return { authenticated: true, user: existing };
  }

  const linkedIdentities = deps.linkedIdentities ?? defaultLinkedIdentities;
  const canonicalId = linkedIdentities.get(userId);
  if (canonicalId) {
    const canonicalUser = await deps.repository.findById(canonicalId);
    if (canonicalUser) {
      return { authenticated: true, user: canonicalUser, linked: false };
    }
    linkedIdentities.delete(userId);
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
    return { authenticated: false, reason: decision.reason };
  }

  const result = await deps.repository.upsertById({ id: decision.id, email: decision.email });
  if (result.kind === "email_conflict") {
    return { authenticated: false, reason: "email_conflict" };
  }

  if (matchedByEmail && decision.id !== userId) {
    linkedIdentities.set(userId, decision.id);
  }

  return { authenticated: true, user: result.user, linked: matchedByEmail !== null };
}
