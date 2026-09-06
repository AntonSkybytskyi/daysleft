import type { TrackedDestination } from "../infra/tracked-destinations-repository";

export type ListTrackedDestinationsDeps = {
  repository: { listForOwner: (userId: string) => Promise<TrackedDestination[]> };
};

export type ListTrackedDestinationsResult =
  | { kind: "ok"; destinations: TrackedDestination[] }
  | { kind: "read_failed" };

// destinations: [] is the confirmed-empty result (AC-10) — distinct from read_failed (AC-11),
// which the first-run screen must never be shown for.
export async function listTrackedDestinations(
  deps: ListTrackedDestinationsDeps,
  userId: string,
): Promise<ListTrackedDestinationsResult> {
  try {
    const destinations = await deps.repository.listForOwner(userId);
    return { kind: "ok", destinations };
  } catch {
    return { kind: "read_failed" };
  }
}
