import type { TrackedDestination } from "../infra/tracked-destinations-repository";

export type RemoveTrackedDestinationDeps = {
  repository: { deleteByIdForOwner: (id: string, userId: string) => Promise<TrackedDestination | null> };
};

export type RemoveTrackedDestinationInput = { id: string; userId: string };

export type RemoveTrackedDestinationResult =
  | { kind: "removed" }
  | { kind: "not_found" }
  | { kind: "not_removed" };

// not-yours / already-removed / never-existed all resolve to the same not_found via the
// repository's ownership-scoped WHERE (ADR-0008) — no branch here distinguishes them.
export async function removeTrackedDestination(
  deps: RemoveTrackedDestinationDeps,
  input: RemoveTrackedDestinationInput,
): Promise<RemoveTrackedDestinationResult> {
  try {
    const deleted = await deps.repository.deleteByIdForOwner(input.id, input.userId);
    return deleted ? { kind: "removed" } : { kind: "not_found" };
  } catch {
    return { kind: "not_removed" };
  }
}
