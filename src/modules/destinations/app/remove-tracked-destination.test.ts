import { describe, expect, it, vi } from "vitest";
import { removeTrackedDestination } from "./remove-tracked-destination";

describe("removeTrackedDestination", () => {
  it("confirms removal when the repository deletes the row", async () => {
    const repository = { deleteByIdForOwner: vi.fn().mockResolvedValue({ id: "d1" }) };

    const result = await removeTrackedDestination({ repository }, { id: "d1", userId: "user_1" });

    expect(result).toEqual({ kind: "removed" });
  });

  it("returns not_found identically for another owner's record", async () => {
    const repository = { deleteByIdForOwner: vi.fn().mockResolvedValue(null) };

    const result = await removeTrackedDestination({ repository }, { id: "d1", userId: "user_2" });

    expect(result).toEqual({ kind: "not_found" });
  });

  it("returns not_found identically for an already-removed record", async () => {
    const repository = { deleteByIdForOwner: vi.fn().mockResolvedValue(null) };

    const result = await removeTrackedDestination({ repository }, { id: "d1", userId: "user_1" });

    expect(result).toEqual({ kind: "not_found" });
  });

  it("returns not_found identically for a never-existed record", async () => {
    const repository = { deleteByIdForOwner: vi.fn().mockResolvedValue(null) };

    const result = await removeTrackedDestination({ repository }, { id: "never", userId: "user_1" });

    expect(result).toEqual({ kind: "not_found" });
  });

  it("returns a distinct not_removed result on a delete failure, leaving the row intact", async () => {
    const repository = { deleteByIdForOwner: vi.fn().mockRejectedValue(new Error("boom")) };

    const result = await removeTrackedDestination({ repository }, { id: "d1", userId: "user_1" });

    expect(result).toEqual({ kind: "not_removed" });
  });
});
