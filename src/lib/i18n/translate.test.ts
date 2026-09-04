import { describe, expect, it } from "vitest";
import { translate, translateAll } from "./translate";

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

describe("translateAll", () => {
  it("resolves a batch of keys into a single record", () => {
    expect(translateAll(["login.heading", "dashboard.logout"] as const, "en-US")).toEqual({
      "login.heading": "Sign in to daysleft",
      "dashboard.logout": "Log out",
    });
  });
});
