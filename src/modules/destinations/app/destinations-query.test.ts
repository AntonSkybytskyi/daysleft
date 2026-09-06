import { QueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  destinationsQueryKey,
  destinationsQueryOptions,
  addDestinationMutationOptions,
  removeDestinationMutationOptions,
  resolveSavedAddressQueryOptions,
  DestinationsSessionInvalidError,
} from "./destinations-query";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe("destinationsQueryOptions", () => {
  it("uses a query key scoped to the userId, with staleTime/gcTime Infinity and retry disabled", () => {
    const options = destinationsQueryOptions("user_1");

    expect(options.queryKey).toEqual(destinationsQueryKey("user_1"));
    expect(destinationsQueryKey("user_1")).toEqual(["destinations", "user_1"]);
    expect(options.staleTime).toBe(Infinity);
    expect(options.gcTime).toBe(Infinity);
    expect(options.retry).toBe(false);
  });

  it("throws a typed DestinationsSessionInvalidError on a 401 response", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: { code: "auth.session_invalid", message: "Sign in." } }),
    });

    const options = destinationsQueryOptions("user_1");
    await expect((options.queryFn as () => Promise<unknown>)()).rejects.toBeInstanceOf(
      DestinationsSessionInvalidError,
    );
  });

  it("resolves the parsed list on a 200 response", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ items: [{ id: "d1", destination_ref: "thailand", created_at: "2026-01-01T00:00:00Z" }] }),
    });

    const options = destinationsQueryOptions("user_1");
    const result = await (options.queryFn as () => Promise<{ items: unknown[] }>)();

    expect(result.items).toHaveLength(1);
  });
});

describe("addDestinationMutationOptions", () => {
  it("updates the cache only in onSuccess via setQueryData, never optimistically", async () => {
    const queryClient = new QueryClient();
    const key = destinationsQueryKey("user_1");
    queryClient.setQueryData(key, { items: [] });

    const created = { id: "d1", destination_ref: "thailand", created_at: "2026-01-01T00:00:00Z" };
    fetchMock.mockResolvedValue({ ok: true, status: 201, json: async () => created });

    const options = addDestinationMutationOptions(queryClient, "user_1");
    const mutateAsync = async (input: { destination_ref: string }) => {
      const result = await (options.mutationFn as (i: typeof input) => Promise<typeof created>)(input);
      // No optimistic write should have happened before this point.
      expect(queryClient.getQueryData(key)).toEqual({ items: [] });
      await options.onSuccess?.(result, input, undefined, {} as never);
      return result;
    };

    await mutateAsync({ destination_ref: "thailand" });

    expect(queryClient.getQueryData(key)).toEqual({ items: [created] });
  });
});

describe("resolveSavedAddressQueryOptions", () => {
  it("resolves ok with the record on a 200 response", async () => {
    const row = { id: "d1", destination_ref: "thailand", created_at: "2026-01-01T00:00:00Z" };
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => row });

    const options = resolveSavedAddressQueryOptions("d1");
    const result = await (options.queryFn as () => Promise<unknown>)();

    expect(result).toEqual({ kind: "ok", destination: row });
  });

  it("resolves not_found on a 404 response, without throwing (AC-06 is not a query error)", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: { code: "destinations.not_found", message: "x" } }),
    });

    const options = resolveSavedAddressQueryOptions("missing");
    const result = await (options.queryFn as () => Promise<unknown>)();

    expect(result).toEqual({ kind: "not_found" });
  });

  it("throws a typed DestinationsSessionInvalidError on a 401 response", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: { code: "auth.session_invalid", message: "x" } }),
    });

    const options = resolveSavedAddressQueryOptions("d1");
    await expect((options.queryFn as () => Promise<unknown>)()).rejects.toBeInstanceOf(
      DestinationsSessionInvalidError,
    );
  });
});

describe("removeDestinationMutationOptions", () => {
  it("removes the record from the cache only in onSuccess", async () => {
    const queryClient = new QueryClient();
    const key = destinationsQueryKey("user_1");
    const existing = { id: "d1", destination_ref: "thailand", created_at: "2026-01-01T00:00:00Z" };
    queryClient.setQueryData(key, { items: [existing] });

    fetchMock.mockResolvedValue({ ok: true, status: 204, json: async () => undefined });

    const options = removeDestinationMutationOptions(queryClient, "user_1");
    await (options.mutationFn as (id: string) => Promise<void>)("d1");
    expect(queryClient.getQueryData(key)).toEqual({ items: [existing] });

    await options.onSuccess?.(undefined, "d1", undefined, {} as never);

    expect(queryClient.getQueryData(key)).toEqual({ items: [] });
  });
});
