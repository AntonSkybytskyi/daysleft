import { describe, expect, it, vi } from "vitest";
import { handleListDestinations, handleAddDestination } from "./handlers";
import type { DestinationsDeps } from "@/modules/destinations/infra/destinations-deps";

function makeDeps(overrides: Partial<DestinationsDeps> = {}): DestinationsDeps {
  return {
    getAuthUserId: async () => "user_1",
    repository: { listForOwner: vi.fn(), insert: vi.fn() } as unknown as DestinationsDeps["repository"],
    ...overrides,
  };
}

describe("GET /api/v1/destinations", () => {
  it("returns 200 with the ordered list, matching the TrackedDestinationList schema", async () => {
    const row = {
      id: "01935e4a-6f3a-7c21-9c3e-1a2b3c4d5e6f",
      userId: "user_1",
      destinationRef: "thailand",
      createdAt: new Date("2026-08-01T09:00:00Z"),
    };
    const deps = makeDeps({
      repository: { listForOwner: vi.fn().mockResolvedValue([row]), insert: vi.fn() } as unknown as DestinationsDeps["repository"],
    });

    const result = await handleListDestinations(deps);

    expect(result).toEqual({
      status: 200,
      body: {
        items: [{ id: row.id, destination_ref: "thailand", created_at: "2026-08-01T09:00:00.000Z" }],
      },
    });
  });

  it("returns 401 revealing nothing when unauthenticated", async () => {
    const deps = makeDeps({ getAuthUserId: async () => null });

    const result = await handleListDestinations(deps);

    expect(result).toEqual({
      status: 401,
      body: { error: { code: "auth.session_invalid", message: "Sign in to view your tracked destinations." } },
    });
  });
});

describe("POST /api/v1/destinations", () => {
  it("returns 201 with the recorded record", async () => {
    const inserted = {
      id: "01935e4b-1a02-7abc-9def-0123456789ab",
      userId: "user_1",
      destinationRef: "thailand",
      createdAt: new Date("2026-09-06T12:00:00Z"),
    };
    const deps = makeDeps({
      repository: { listForOwner: vi.fn(), insert: vi.fn().mockResolvedValue(inserted) } as unknown as DestinationsDeps["repository"],
    });

    const result = await handleAddDestination(deps, { destination_ref: "thailand" });

    expect(result).toEqual({
      status: 201,
      body: { id: inserted.id, destination_ref: "thailand", created_at: "2026-09-06T12:00:00.000Z" },
    });
  });

  it("returns 401 when unauthenticated", async () => {
    const deps = makeDeps({ getAuthUserId: async () => null });

    const result = await handleAddDestination(deps, { destination_ref: "thailand" });

    expect(result).toEqual({
      status: 401,
      body: { error: { code: "auth.session_invalid", message: "Sign in to add a tracked destination." } },
    });
  });

  it("returns 422 destinations.unsupported_reference for an unsupported reference", async () => {
    const deps = makeDeps();

    const result = await handleAddDestination(deps, { destination_ref: "atlantis" });

    expect(result).toEqual({
      status: 422,
      body: {
        error: {
          code: "destinations.unsupported_reference",
          message: "Only the destinations the app supports can be tracked.",
        },
      },
    });
  });
});
