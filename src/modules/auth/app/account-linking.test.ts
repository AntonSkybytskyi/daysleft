import { describe, expect, it } from "vitest";
import { resolveAccountLinking } from "./account-linking";

describe("resolveAccountLinking", () => {
  it("links a second sign-in method to the existing account matched by verified email", () => {
    const decision = resolveAccountLinking(
      { clerkUserId: "user_new_via_magic_link", verifiedEmail: "traveler@example.com" },
      { id: "user_original_via_google", email: "traveler@example.com" },
    );

    expect(decision).toEqual({
      kind: "upsert",
      id: "user_original_via_google",
      email: "traveler@example.com",
    });
  });

  it("upserts a brand-new account by the Clerk id when no existing account matches the email", () => {
    const decision = resolveAccountLinking(
      { clerkUserId: "user_brand_new", verifiedEmail: "fresh@example.com" },
      null,
    );

    expect(decision).toEqual({
      kind: "upsert",
      id: "user_brand_new",
      email: "fresh@example.com",
    });
  });

  it("rejects before any persistence call when the payload has no verified email", () => {
    const decision = resolveAccountLinking(
      { clerkUserId: "user_no_verified_email", verifiedEmail: null },
      null,
    );

    expect(decision).toEqual({ kind: "rejected", reason: "email_required" });
  });
});
