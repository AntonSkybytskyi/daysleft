import { resolveAccountLinking } from "@/modules/auth/app/account-linking";
import { errorBody } from "@/lib/errors";
import { verifyClerkWebhook, type ClerkWebhookHeaders } from "../verify-webhook";
import type { UsersRepository } from "../users-repository";
import type { LinkedIdentitiesRepository } from "../linked-identities-repository";

export type ClerkWebhookRequest = {
  headers: ClerkWebhookHeaders;
  rawBody: string;
};

export type WebhookDedupeStore = {
  get: (svixId: string) => ClerkWebhookResult | undefined;
  set: (svixId: string, result: ClerkWebhookResult) => void;
};

export type ClerkWebhookDeps = {
  webhookSecret: string;
  repository: UsersRepository;
  verify?: typeof verifyClerkWebhook;
  dedupeStore?: WebhookDedupeStore;
  // A stored linked_identities row is only a snapshot of the email that justified it at link
  // time — invalidating it once this event proves that email actually changed (either side)
  // forces the next interactive session to re-derive the mapping from Clerk's current data,
  // instead of durably misattributing the identity to a stale canonical account forever.
  // Required, not optional — this safety property must not be silently droppable by a caller.
  linkedIdentities: Pick<LinkedIdentitiesRepository, "invalidate" | "findCanonicalUserId">;
};

export type ClerkWebhookResult = {
  status: 200 | 401 | 422;
  body: unknown;
};

type ClerkEmailAddress = { email_address: string; verification: { status: string } | null };
type ClerkEventData = { id: string; email_addresses?: ClerkEmailAddress[] };
type ClerkEvent = { type: string; data: ClerkEventData };

const handledEventTypes = new Set(["user.created", "user.updated"]);

const dedupedResponse: ClerkWebhookResult = { status: 200, body: { deduped: true } };

export async function handleClerkWebhook(
  request: ClerkWebhookRequest,
  deps: ClerkWebhookDeps,
): Promise<ClerkWebhookResult> {
  const verify = deps.verify ?? verifyClerkWebhook;
  const verification = await verify(request.rawBody, request.headers, deps.webhookSecret);

  if (!verification.valid) {
    return {
      status: 401,
      body: errorBody("auth.webhook_invalid_signature", "Webhook signature verification failed."),
    };
  }

  // The dedupe cache is only consulted once the signature is verified, and it only ever holds a
  // PII-free marker — an unauthenticated POST replaying a previously-seen svix-id must not be able
  // to read a cached user's id/email back out without a valid signature of its own.
  const svixId = request.headers["svix-id"];
  if (svixId && deps.dedupeStore?.get(svixId)) {
    return dedupedResponse;
  }

  const event = verification.event as ClerkEvent;
  if (!handledEventTypes.has(event.type)) {
    return { status: 200, body: { ignored: true, type: event.type } };
  }

  const data = event.data;
  const emailAddresses = Array.isArray(data.email_addresses) ? data.email_addresses : [];
  const verifiedEntry = emailAddresses.find((entry) => entry.verification?.status === "verified");
  const verifiedEmail = verifiedEntry?.email_address ?? null;

  const [ownRecord, priorCanonicalId] = await Promise.all([
    deps.repository.findById(data.id),
    deps.linkedIdentities.findCanonicalUserId(data.id),
  ]);
  const priorCanonicalUser = priorCanonicalId ? await deps.repository.findById(priorCanonicalId) : null;

  // A stored mapping is only ever a snapshot of the email that justified it. Invalidate it
  // only when this event PROVES that email actually changed — either this account's own
  // stored email (ownRecord, present only for a canonical account), or the canonical account
  // this identity previously resolved to no longer sharing the new verified email — never on
  // an unrelated profile edit (display name, avatar, metadata), which would otherwise re-fire
  // the "linked" banner and cost an extra Clerk fetch for nothing. A null verifiedEmail (no
  // verified address on this event) is absence of proof, not proof the email changed to null —
  // gating on it here keeps that case a no-op until the 422 rejection below.
  const ownEmailChanged = verifiedEmail !== null && ownRecord !== null && ownRecord.email !== verifiedEmail;
  const noLongerMatchesCanonical =
    verifiedEmail !== null && priorCanonicalUser !== null && priorCanonicalUser.email !== verifiedEmail;

  if (ownEmailChanged || noLongerMatchesCanonical) {
    await deps.linkedIdentities.invalidate(data.id);
  }

  const existing = verifiedEmail ? await deps.repository.findByEmail(verifiedEmail) : null;
  const decision = resolveAccountLinking({ clerkUserId: data.id, verifiedEmail }, existing);

  if (decision.kind === "rejected") {
    return {
      status: 422,
      body: errorBody("auth.email_required", "A verified email is required to create or link an account."),
    };
  }

  const result = await deps.repository.upsertById({ id: decision.id, email: decision.email });
  if (result.kind === "email_conflict") {
    return {
      status: 422,
      body: errorBody("auth.email_conflict", "That email is already linked to a different account."),
    };
  }

  const success: ClerkWebhookResult = {
    status: 200,
    body: {
      id: result.user.id,
      email: result.user.email,
      created_at: result.user.createdAt,
      updated_at: result.user.updatedAt,
    },
  };
  if (svixId) {
    deps.dedupeStore?.set(svixId, dedupedResponse);
  }
  return success;
}

const DEFAULT_MAX_DEDUPE_ENTRIES = 10_000;

// In-memory only: dedupe within this server instance's lifetime. Redeliveries
// after a restart or to a different instance still re-upsert, which is safe
// (upsertById is idempotent) — this only avoids the redundant write. Bounded by
// maxEntries (oldest-first eviction, since Map preserves insertion order) so a
// long-lived process doesn't grow this without limit.
export function createInMemoryDedupeStore(options?: { maxEntries?: number }): WebhookDedupeStore {
  const maxEntries = options?.maxEntries ?? DEFAULT_MAX_DEDUPE_ENTRIES;
  const seen = new Map<string, ClerkWebhookResult>();
  return {
    get: (svixId) => seen.get(svixId),
    set: (svixId, result) => {
      if (seen.size >= maxEntries && !seen.has(svixId)) {
        const oldestKey = seen.keys().next().value;
        if (oldestKey !== undefined) {
          seen.delete(oldestKey);
        }
      }
      seen.set(svixId, result);
    },
  };
}
