import { describe, expect, it } from "vitest";
import { resolveReturnTo, resolveLoginReturnTo } from "./return-to";

const origin = "https://daysleft.example";
const defaultPath = "/dashboard";

describe("resolveReturnTo", () => {
  it("preserves a relative return-to path", () => {
    expect(resolveReturnTo("/trips/123", origin, defaultPath)).toBe("/trips/123");
  });

  it("preserves an absolute return-to URL sharing this app's scheme/host/port", () => {
    expect(resolveReturnTo("https://daysleft.example/trips/123?x=1", origin, defaultPath)).toBe("/trips/123?x=1");
  });

  it("discards an off-origin return-to value in favor of the given default destination", () => {
    expect(resolveReturnTo("https://evil.example/steal", origin, defaultPath)).toBe("/dashboard");
  });

  it("discards a same-host-different-port return-to value", () => {
    expect(resolveReturnTo("https://daysleft.example:9999/trips/123", origin, defaultPath)).toBe("/dashboard");
  });

  it("defaults to the given default destination when no return-to is given", () => {
    expect(resolveReturnTo(null, origin, defaultPath)).toBe("/dashboard");
    expect(resolveReturnTo(null, origin, "/check-email")).toBe("/check-email");
  });

  it("discards a javascript: pseudo-protocol return-to value", () => {
    expect(resolveReturnTo("javascript:alert(1)", origin, defaultPath)).toBe("/dashboard");
  });

  it("discards a path-traversal value that normalises to a protocol-relative //host path", () => {
    expect(resolveReturnTo("/..//evil.example/x", origin, defaultPath)).toBe("/dashboard");
    expect(resolveReturnTo("/a/../..//evil.example", origin, defaultPath)).toBe("/dashboard");
    expect(resolveReturnTo("/./..//evil.example", origin, defaultPath)).toBe("/dashboard");
  });

  it("discards a raw protocol-relative //host return-to value", () => {
    expect(resolveReturnTo("//evil.example", origin, defaultPath)).toBe("/dashboard");
  });
});

describe("resolveLoginReturnTo (the function GET /login actually calls)", () => {
  it("discards an off-origin return_to before it ever reaches Clerk", () => {
    const resolved = resolveLoginReturnTo("https://evil.example/steal-session", "daysleft.example", "https", defaultPath);
    expect(resolved).toBe("/dashboard");
    expect(resolved).not.toContain("evil.example");
  });

  it("preserves a same-origin return_to", () => {
    expect(resolveLoginReturnTo("/trips/123", "daysleft.example", "https", defaultPath)).toBe("/trips/123");
  });

  it("defaults host/proto when headers are absent", () => {
    expect(resolveLoginReturnTo(null, null, null, defaultPath)).toBe("/dashboard");
  });
});
