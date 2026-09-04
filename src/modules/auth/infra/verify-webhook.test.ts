import { Webhook } from "svix";
import { describe, expect, it } from "vitest";
import { verifyClerkWebhook } from "./verify-webhook";

const secret = "whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw";

function sign(payload: string, msgId: string, timestamp: Date) {
  const webhook = new Webhook(secret);
  const signature = webhook.sign(msgId, timestamp, payload);
  return {
    "svix-id": msgId,
    "svix-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
    "svix-signature": signature,
  };
}

describe("verifyClerkWebhook", () => {
  it("verifies a validly-signed payload and returns the parsed event", async () => {
    const payload = JSON.stringify({ type: "user.created", data: { id: "user_123" } });
    const headers = sign(payload, "msg_1", new Date());

    const result = await verifyClerkWebhook(payload, headers, secret);

    expect(result.valid).toBe(true);
    expect(result).toMatchObject({ event: { type: "user.created", data: { id: "user_123" } } });
  });

  it("rejects a tampered payload", async () => {
    const payload = JSON.stringify({ type: "user.created", data: { id: "user_123" } });
    const headers = sign(payload, "msg_2", new Date());
    const tamperedPayload = JSON.stringify({ type: "user.created", data: { id: "user_999" } });

    const result = await verifyClerkWebhook(tamperedPayload, headers, secret);

    expect(result).toEqual({ valid: false });
  });
});
