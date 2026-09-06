import { describe, expect, it, vi } from "vitest";
import { handleGetDestination, handleRemoveDestination } from "./route";
import type { DestinationsDeps } from "@/modules/destinations/infra/destinations-deps";

function makeDeps(overrides: Partial<DestinationsDeps> = {}): DestinationsDeps {
  return {
    getAuthUserId: async () => "user_1",
    repository: {
      findByIdForOwner: vi.fn(),
      deleteByIdForOwner: vi.fn(),
    } as unknown as DestinationsDeps["repository"],
    ...overrides,
  };
}

describe("GET /api/v1/destinations/{trackedDestinationId}", () => {
  it("returns 200 for the owner", async () => {
    const row = {
      id: "01935e4b-1a02-7abc-9def-0123456789ab",
      userId: "user_1",
      destinationRef: "thailand",
      createdAt: new Date("2026-09-06T12:00:00Z"),
    };
    const deps = makeDeps({
      repository: { findByIdForOwner: vi.fn().mockResolvedValue(row), deleteByIdForOwner: vi.fn() } as unknown as DestinationsDeps["repository"],
    });

    const result = await handleGetDestination(deps, row.id);

    expect(result).toEqual({
      status: 200,
      body: { id: row.id, destination_ref: "thailand", created_at: "2026-09-06T12:00:00.000Z" },
    });
  });

  it("returns 401 taking precedence on a confirmed invalid sign-in", async () => {
    const deps = makeDeps({ getAuthUserId: async () => null });

    const result = await handleGetDestination(deps, "any-id");

    expect(result).toEqual({
      status: 401,
      body: { error: { code: "auth.session_invalid", message: "Sign in to view this tracked destination." } },
    });
  });

  it("returns 404 destinations.not_found identically for another owner's/removed/never-existed ids", async () => {
    const deps = makeDeps({
      repository: { findByIdForOwner: vi.fn().mockResolvedValue(null), deleteByIdForOwner: vi.fn() } as unknown as DestinationsDeps["repository"],
    });

    const result = await handleGetDestination(deps, "missing-id");

    expect(result).toEqual({
      status: 404,
      body: { error: { code: "destinations.not_found", message: "That destination isn't available." } },
    });
  });
});

describe("DELETE /api/v1/destinations/{trackedDestinationId}", () => {
  it("returns 204 on confirmed removal", async () => {
    const deps = makeDeps({
      repository: { findByIdForOwner: vi.fn(), deleteByIdForOwner: vi.fn().mockResolvedValue({ id: "d1" }) } as unknown as DestinationsDeps["repository"],
    });

    const result = await handleRemoveDestination(deps, "d1");

    expect(result).toEqual({ status: 204, body: undefined });
  });

  it("returns 401 taking precedence on a confirmed invalid sign-in", async () => {
    const deps = makeDeps({ getAuthUserId: async () => null });

    const result = await handleRemoveDestination(deps, "d1");

    expect(result).toEqual({
      status: 401,
      body: { error: { code: "auth.session_invalid", message: "Sign in to manage your tracked destinations." } },
    });
  });

  it("returns 404 destinations.not_found identically for another owner's/removed/never-existed ids", async () => {
    const deps = makeDeps({
      repository: { findByIdForOwner: vi.fn(), deleteByIdForOwner: vi.fn().mockResolvedValue(null) } as unknown as DestinationsDeps["repository"],
    });

    const result = await handleRemoveDestination(deps, "missing-id");

    expect(result).toEqual({
      status: 404,
      body: { error: { code: "destinations.not_found", message: "That destination isn't available." } },
    });
  });

  it("returns 500 on an incomplete removal, using the generic server-fault code", async () => {
    const deps = makeDeps({
      repository: { findByIdForOwner: vi.fn(), deleteByIdForOwner: vi.fn().mockRejectedValue(new Error("boom")) } as unknown as DestinationsDeps["repository"],
    });

    const result = await handleRemoveDestination(deps, "d1");

    expect(result).toEqual({
      status: 500,
      body: { error: { code: "internal.unexpected", message: "Something went wrong." } },
    });
  });
});
