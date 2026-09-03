import { Webhook } from "svix";

export type ClerkWebhookHeaders = {
  "svix-id": string;
  "svix-timestamp": string;
  "svix-signature": string;
};

export type ClerkWebhookEvent = { type: string; data: Record<string, unknown> };

export type VerifyResult =
  | { valid: true; event: ClerkWebhookEvent }
  | { valid: false };

export function verifyClerkWebhook(
  payload: string,
  headers: ClerkWebhookHeaders,
  webhookSecret: string,
): VerifyResult {
  const webhook = new Webhook(webhookSecret);

  try {
    webhook.verify(payload, headers);
    return { valid: true, event: JSON.parse(payload) as ClerkWebhookEvent };
  } catch {
    return { valid: false };
  }
}
