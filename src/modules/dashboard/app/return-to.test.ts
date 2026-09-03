import { describe, expect, it } from "vitest";
import { resolveReturnTo } from "./return-to";

const origin = "https://daysleft.example";

describe("resolveReturnTo", () => {
  it("preserves a relative return-to path", () => {
    expect(resolveReturnTo("/trips/123", origin)).toBe("/trips/123");
  });

  it("preserves an absolute return-to URL sharing this app's scheme/host/port", () => {
    expect(resolveReturnTo("https://daysleft.example/trips/123?x=1", origin)).toBe("/trips/123?x=1");
  });

  it("discards an off-origin return-to value in favor of the default dashboard destination", () => {
    expect(resolveReturnTo("https://evil.example/steal", origin)).toBe("/dashboard");
  });

  it("discards a same-host-different-port return-to value", () => {
    expect(resolveReturnTo("https://daysleft.example:9999/trips/123", origin)).toBe("/dashboard");
  });

  it("defaults to the dashboard destination when no return-to is given", () => {
    expect(resolveReturnTo(null, origin)).toBe("/dashboard");
  });

  it("discards a javascript: pseudo-protocol return-to value", () => {
    expect(resolveReturnTo("javascript:alert(1)", origin)).toBe("/dashboard");
  });
});
