import { describe, expect, it } from "vitest";
import { config } from "./middleware";

describe("middleware allowlist", () => {
  it("registers /api/v1/destinations and /api/v1/destinations/:path* so Clerk's auth context initializes on them", () => {
    expect(config.matcher).toContain("/api/v1/destinations");
    expect(config.matcher).toContain("/api/v1/destinations/:path*");
  });
});
