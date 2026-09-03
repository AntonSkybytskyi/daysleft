import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";

export type ClerkWebhookHeaders = {
  "svix-id": string;
  "svix-timestamp": string;
  "svix-signature": string;
};

export type ClerkWebhookEvent = { type: string; data: Record<string, unknown> };

export type VerifyResult = { valid: true; event: ClerkWebhookEvent } | { valid: false };

export async function verifyClerkWebhook(
  payload: string,
  headers: ClerkWebhookHeaders,
  webhookSecret: string,
): Promise<VerifyResult> {
  const request = new NextRequest("https://clerk.webhook.local/webhooks/clerk", {
    method: "POST",
    headers,
    body: payload,
  });

  try {
    const event = await verifyWebhook(request, { signingSecret: webhookSecret });
    return { valid: true, event: event as unknown as ClerkWebhookEvent };
  } catch {
    return { valid: false };
  }
}
