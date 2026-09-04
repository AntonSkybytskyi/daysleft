import { afterEach, describe, expect, it, vi } from "vitest";

describe("createDbClient", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("throws instead of building a client when DATABASE_URL is unset", async () => {
    vi.stubEnv("DATABASE_URL", "");
    const { createDbClient } = await import("./client");

    expect(() => createDbClient()).toThrow(/DATABASE_URL/);
  });

  it("returns the same memoized client instance across calls instead of a new pool each time", async () => {
    vi.stubEnv("DATABASE_URL", "postgres://user:pass@localhost:5432/db");
    const { createDbClient } = await import("./client");

    const first = createDbClient();
    const second = createDbClient();

    expect(first).toBe(second);
  });

  it("returns distinct clients for two different connection strings instead of always the first one built", async () => {
    const { createDbClient } = await import("./client");

    const first = createDbClient("postgres://user:pass@localhost:5432/db_a");
    const second = createDbClient("postgres://user:pass@localhost:5432/db_b");

    expect(first).not.toBe(second);
  });

  it("still returns the same memoized client for the same connection string called twice", async () => {
    const { createDbClient } = await import("./client");
    const url = "postgres://user:pass@localhost:5432/db_c";

    expect(createDbClient(url)).toBe(createDbClient(url));
  });
});
