import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { clearDashboardQuery, dashboardQueryKey, dashboardQueryOptions } from "./dashboard-query";

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

describe("clearDashboardQuery", () => {
  it("removes exactly the given Traveler's cache entry", () => {
    const client = new QueryClient();
    client.setQueryData(dashboardQueryKey("user_1"), {
      user: { id: "user_1", email: "a@b.com" },
      has_trips: false,
      linked: false,
    });

    expect(client.getQueryData(dashboardQueryKey("user_1"))).toBeDefined();

    clearDashboardQuery(client, "user_1");

    expect(client.getQueryData(dashboardQueryKey("user_1"))).toBeUndefined();
  });

  it("does not touch a different Traveler's entry in the same QueryClient", () => {
    const client = new QueryClient();
    client.setQueryData(dashboardQueryKey("user_1"), {
      user: { id: "user_1", email: "a@b.com" },
      has_trips: false,
      linked: false,
    });
    client.setQueryData(dashboardQueryKey("user_2"), {
      user: { id: "user_2", email: "c@d.com" },
      has_trips: false,
      linked: false,
    });

    clearDashboardQuery(client, "user_1");

    expect(client.getQueryData(dashboardQueryKey("user_2"))).toBeDefined();
  });
});
