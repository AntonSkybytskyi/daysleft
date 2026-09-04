import { describe, expect, it } from "vitest";
import { resolveLoginState } from "./resolve-login-state";

describe("resolveLoginState", () => {
  it("resolves error-sign-in-failed when /sso-callback redirected with ?error=sign_in_failed (AC-01b)", () => {
    expect(resolveLoginState({ error: "sign_in_failed" })).toBe("error-sign-in-failed");
  });

  it("resolves error-email-required for ?error=email_required", () => {
    expect(resolveLoginState({ error: "email_required" })).toBe("error-email-required");
  });

  it("resolves redirected-sign-in-required when a return_to is present with no error", () => {
    expect(resolveLoginState({ return_to: "/dashboard/trips/1" })).toBe("redirected-sign-in-required");
  });

  it("resolves default otherwise", () => {
    expect(resolveLoginState({})).toBe("default");
  });
});
