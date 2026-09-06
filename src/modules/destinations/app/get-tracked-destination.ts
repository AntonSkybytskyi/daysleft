import type { TrackedDestination } from "../infra/tracked-destinations-repository";

export type GetTrackedDestinationDeps = {
  repository: { findByIdForOwner: (id: string, userId: string) => Promise<TrackedDestination | null> };
};

export type GetTrackedDestinationInput = { id: string; userId: string };

export type GetTrackedDestinationResult =
  | { kind: "ok"; destination: TrackedDestination }
  | { kind: "not_found" };

// One query shape for every case — not-yours / removed / never-existed are indistinguishable
// (ADR-0008); a delisted destination still resolves here (AC-09).
export async function getTrackedDestination(
  deps: GetTrackedDestinationDeps,
  input: GetTrackedDestinationInput,
): Promise<GetTrackedDestinationResult> {
  const destination = await deps.repository.findByIdForOwner(input.id, input.userId);
  return destination ? { kind: "ok", destination } : { kind: "not_found" };
}
