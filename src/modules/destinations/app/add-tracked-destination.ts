import type {
  InsertTrackedDestinationInput,
  TrackedDestination,
} from "../infra/tracked-destinations-repository";

export type AddTrackedDestinationDeps = {
  repository: { insert: (input: InsertTrackedDestinationInput) => Promise<TrackedDestination> };
  isSupportedRef: (ref: string) => boolean;
  newId: () => string;
};

export type AddTrackedDestinationInput = { userId: string; destinationRef: string };

export type AddTrackedDestinationResult =
  | { kind: "ok"; destination: TrackedDestination }
  | { kind: "unsupported_reference" };

// Repeated records are legitimate by design (AC-01) — no uniqueness check here.
export async function addTrackedDestination(
  deps: AddTrackedDestinationDeps,
  input: AddTrackedDestinationInput,
): Promise<AddTrackedDestinationResult> {
  if (!deps.isSupportedRef(input.destinationRef)) {
    return { kind: "unsupported_reference" };
  }

  const destination = await deps.repository.insert({
    id: deps.newId(),
    userId: input.userId,
    destinationRef: input.destinationRef,
  });
  return { kind: "ok", destination };
}
