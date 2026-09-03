import { createClerkClient } from "@clerk/nextjs/server";

export function getClerkWebhookSecret(): string {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("CLERK_WEBHOOK_SECRET is not set");
  }
  return secret;
}

export function getClerkClient() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("CLERK_SECRET_KEY is not set");
  }
  return createClerkClient({ secretKey });
}
