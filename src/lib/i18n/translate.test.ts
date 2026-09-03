import { describe, expect, it } from "vitest";
import { translate } from "./translate";

describe("translate", () => {
  it("resolves a key from en.json for a supported Accept-Language", () => {
    expect(translate("login.heading", "en-US,en;q=0.9")).toBe("Sign in to daysleft");
  });

  it("falls back to English for an unsupported Accept-Language", () => {
    expect(translate("login.heading", "fr-FR,fr;q=0.9")).toBe("Sign in to daysleft");
  });

  it("falls back to English when no Accept-Language is given", () => {
    expect(translate("login.heading")).toBe("Sign in to daysleft");
  });

  it("returns the key itself when it has no catalog entry", () => {
    expect(translate("nonexistent.key")).toBe("nonexistent.key");
  });
});
