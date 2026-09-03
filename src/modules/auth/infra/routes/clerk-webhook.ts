import { resolveAccountLinking } from "@/modules/auth/app/account-linking";
import { errorBody } from "@/lib/errors";
import { verifyClerkWebhook, type ClerkWebhookHeaders } from "../verify-webhook";
import type { UsersRepository } from "../users-repository";

export type ClerkWebhookRequest = {
  headers: ClerkWebhookHeaders;
  rawBody: string;
};

export type ClerkWebhookDeps = {
  webhookSecret: string;
  repository: UsersRepository;
  verify?: typeof verifyClerkWebhook;
};

export type ClerkWebhookResult = {
  status: 200 | 401 | 422;
  body: unknown;
};

type ClerkEmailAddress = { email_address: string; verification: { status: string } };
type ClerkEventData = { id: string; email_addresses: ClerkEmailAddress[] };

export async function handleClerkWebhook(
  request: ClerkWebhookRequest,
  deps: ClerkWebhookDeps,
): Promise<ClerkWebhookResult> {
  const verify = deps.verify ?? verifyClerkWebhook;
  const verification = verify(request.rawBody, request.headers, deps.webhookSecret);

  if (!verification.valid) {
    return {
      status: 401,
      body: errorBody("auth.webhook_invalid_signature", "Webhook signature verification failed."),
    };
  }

  const data = verification.event.data as ClerkEventData;
  const verifiedEntry = data.email_addresses.find((entry) => entry.verification.status === "verified");
  const verifiedEmail = verifiedEntry?.email_address ?? null;

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
      body: errorBody("auth.email_required", "That email is already linked to a different account."),
    };
  }

  return {
    status: 200,
    body: {
      id: result.user.id,
      email: result.user.email,
      created_at: result.user.createdAt,
      updated_at: result.user.updatedAt,
    },
  };
}
