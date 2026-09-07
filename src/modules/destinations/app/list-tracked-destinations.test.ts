import { describe, expect, it, vi } from "vitest";
import { listTrackedDestinations } from "./list-tracked-destinations";
import type { TrackedDestination } from "../infra/tracked-destinations-repository";

function makeDestination(overrides: Partial<TrackedDestination> = {}): TrackedDestination {
  return {
    id: "018f0000-0000-7000-8000-00000000000a",
    userId: "user_1",
    destinationRef: "thailand",
    createdAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

describe("listTrackedDestinations", () => {
  it("returns the recorded-order list from the repository", async () => {
    const rows = [makeDestination({ id: "a" }), makeDestination({ id: "b" })];
    const repository = { listForOwner: vi.fn().mockResolvedValue(rows) };

    const result = await listTrackedDestinations({ repository }, "user_1");

    expect(result).toEqual({ kind: "ok", destinations: rows });
    expect(repository.listForOwner).toHaveBeenCalledWith("user_1");
  });

  it("returns a confirmed-empty ok result distinct from a read failure", async () => {
    const repository = { listForOwner: vi.fn().mockResolvedValue([]) };

    const result = await listTrackedDestinations({ repository }, "user_1");

    expect(result).toEqual({ kind: "ok", destinations: [] });
  });

  it("returns a typed recoverable-error result when the read fails", async () => {
    const repository = { listForOwner: vi.fn().mockRejectedValue(new Error("boom")) };

    const result = await listTrackedDestinations({ repository }, "user_1");

    expect(result).toEqual({ kind: "read_failed" });
  });
});
