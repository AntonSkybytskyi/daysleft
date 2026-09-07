import { describe, expect, it, vi } from "vitest";
import { addTrackedDestination } from "./add-tracked-destination";

describe("addTrackedDestination", () => {
  it("refuses an unsupported reference with destinations.unsupported_reference and writes nothing", async () => {
    const repository = { insert: vi.fn() };
    const deps = { repository, isSupportedRef: () => false, newId: () => "new-id" };

    const result = await addTrackedDestination(deps, { userId: "user_1", destinationRef: "atlantis" });

    expect(result).toEqual({ kind: "unsupported_reference" });
    expect(repository.insert).not.toHaveBeenCalled();
  });

  it("records a supported reference and returns the new row", async () => {
    const inserted = { id: "new-id", userId: "user_1", destinationRef: "thailand", createdAt: new Date() };
    const repository = { insert: vi.fn().mockResolvedValue(inserted) };
    const deps = { repository, isSupportedRef: () => true, newId: () => "new-id" };

    const result = await addTrackedDestination(deps, { userId: "user_1", destinationRef: "thailand" });

    expect(result).toEqual({ kind: "ok", destination: inserted });
    expect(repository.insert).toHaveBeenCalledWith({ id: "new-id", userId: "user_1", destinationRef: "thailand" });
  });

  it("records a supported reference even when a duplicate already exists", async () => {
    const inserted = { id: "new-id-2", userId: "user_1", destinationRef: "thailand", createdAt: new Date() };
    const repository = { insert: vi.fn().mockResolvedValue(inserted) };
    const deps = { repository, isSupportedRef: () => true, newId: () => "new-id-2" };

    const result = await addTrackedDestination(deps, { userId: "user_1", destinationRef: "thailand" });

    expect(result).toEqual({ kind: "ok", destination: inserted });
  });
});
