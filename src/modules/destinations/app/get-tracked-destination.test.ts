import { describe, expect, it, vi } from "vitest";
import { getTrackedDestination } from "./get-tracked-destination";

describe("getTrackedDestination", () => {
  it("returns the record for its owner", async () => {
    const row = { id: "d1", userId: "user_1", destinationRef: "thailand", createdAt: new Date() };
    const repository = { findByIdForOwner: vi.fn().mockResolvedValue(row) };

    const result = await getTrackedDestination({ repository }, { id: "d1", userId: "user_1" });

    expect(result).toEqual({ kind: "ok", destination: row });
    expect(repository.findByIdForOwner).toHaveBeenCalledWith("d1", "user_1");
  });

  it("returns not_found identically for another owner's record", async () => {
    const repository = { findByIdForOwner: vi.fn().mockResolvedValue(null) };

    const result = await getTrackedDestination({ repository }, { id: "d1", userId: "user_2" });

    expect(result).toEqual({ kind: "not_found" });
  });

  it("returns not_found identically for a removed record", async () => {
    const repository = { findByIdForOwner: vi.fn().mockResolvedValue(null) };

    const result = await getTrackedDestination({ repository }, { id: "d1", userId: "user_1" });

    expect(result).toEqual({ kind: "not_found" });
  });

  it("returns not_found identically for a never-existed record, via the same query shape", async () => {
    const repository = { findByIdForOwner: vi.fn().mockResolvedValue(null) };

    const result = await getTrackedDestination({ repository }, { id: "never", userId: "user_1" });

    expect(result).toEqual({ kind: "not_found" });
    expect(repository.findByIdForOwner).toHaveBeenCalledWith("never", "user_1");
  });
});
