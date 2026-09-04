import { describe, expect, it } from "vitest";
import { dashboardQueryKey, dashboardQueryOptions } from "./dashboard-query";

describe("dashboardQueryKey", () => {
  it("includes the signed-in Traveler's identity in the key", () => {
    const key = dashboardQueryKey("user_1");

    expect(key).toContain("user_1");
  });

  it("produces different keys for different Traveler identities", () => {
    expect(dashboardQueryKey("user_1")).not.toEqual(dashboardQueryKey("user_2"));
  });
});

describe("dashboardQueryOptions", () => {
  const options = dashboardQueryOptions("user_1");

  it("never treats the cached response as stale or eligible for garbage collection", () => {
    expect(options.staleTime).toBe(Infinity);
    expect(options.gcTime).toBe(Infinity);
  });

  it("disables every automatic refetch trigger", () => {
    expect(options.refetchOnWindowFocus).toBe(false);
    expect(options.refetchOnReconnect).toBe(false);
  });

  it("disables automatic retry", () => {
    expect(options.retry).toBe(false);
  });
});
