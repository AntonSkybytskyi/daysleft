import { afterEach, describe, expect, it } from "vitest";
import { getClerkClient, getClerkWebhookSecret } from "./clerk-client";

const originalSecretKey = process.env.CLERK_SECRET_KEY;
const originalWebhookSecret = process.env.CLERK_WEBHOOK_SECRET;

afterEach(() => {
  process.env.CLERK_SECRET_KEY = originalSecretKey;
  process.env.CLERK_WEBHOOK_SECRET = originalWebhookSecret;
});

describe("getClerkClient", () => {
  it("throws when CLERK_SECRET_KEY is not set, rather than falling back to a hardcoded secret", () => {
    delete process.env.CLERK_SECRET_KEY;
    expect(() => getClerkClient()).toThrow("CLERK_SECRET_KEY is not set");
  });

  it("builds a client from the env secret key when set", () => {
    process.env.CLERK_SECRET_KEY = "sk_test_example";
    expect(() => getClerkClient()).not.toThrow();
  });
});

describe("getClerkWebhookSecret", () => {
  it("throws when CLERK_WEBHOOK_SECRET is not set", () => {
    delete process.env.CLERK_WEBHOOK_SECRET;
    expect(() => getClerkWebhookSecret()).toThrow("CLERK_WEBHOOK_SECRET is not set");
  });

  it("returns the env value when set", () => {
    process.env.CLERK_WEBHOOK_SECRET = "whsec_example";
    expect(getClerkWebhookSecret()).toBe("whsec_example");
  });
});
