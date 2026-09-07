import { errorBody, toErrorEnvelope } from "@/lib/errors";
import { isSupportedDestinationRef } from "@/modules/destinations/app/catalogue";
import { addTrackedDestination } from "@/modules/destinations/app/add-tracked-destination";
import { listTrackedDestinations } from "@/modules/destinations/app/list-tracked-destinations";
import type { DestinationsDeps } from "@/modules/destinations/infra/destinations-deps";
import type { TrackedDestination } from "@/modules/destinations/infra/tracked-destinations-repository";
import { newId } from "@/lib/id";

export type RouteResult<T> = { status: number; body: T };

export function toTrackedDestinationJson(row: TrackedDestination) {
  return {
    id: row.id,
    destination_ref: row.destinationRef,
    created_at: row.createdAt.toISOString(),
  };
}

export async function handleListDestinations(
  deps: DestinationsDeps,
): Promise<RouteResult<{ items: ReturnType<typeof toTrackedDestinationJson>[] } | { error: ReturnType<typeof errorBody> }>> {
  const userId = await deps.getAuthUserId();
  if (!userId) {
    return {
      status: 401,
      body: toErrorEnvelope(errorBody("auth.session_invalid", "Sign in to view your tracked destinations.")),
    };
  }

  const result = await listTrackedDestinations(deps, userId);
  if (result.kind === "read_failed") {
    return {
      status: 500,
      body: toErrorEnvelope(errorBody("destinations.unavailable", "Your tracked destinations could not be read.")),
    };
  }

  return { status: 200, body: { items: result.destinations.map(toTrackedDestinationJson) } };
}

export async function handleAddDestination(
  deps: DestinationsDeps,
  input: { destination_ref: string },
): Promise<RouteResult<ReturnType<typeof toTrackedDestinationJson> | { error: ReturnType<typeof errorBody> }>> {
  const userId = await deps.getAuthUserId();
  if (!userId) {
    return {
      status: 401,
      body: toErrorEnvelope(errorBody("auth.session_invalid", "Sign in to add a tracked destination.")),
    };
  }

  const result = await addTrackedDestination(
    { repository: deps.repository, isSupportedRef: isSupportedDestinationRef, newId },
    { userId, destinationRef: input.destination_ref },
  );

  if (result.kind === "unsupported_reference") {
    return {
      status: 422,
      body: toErrorEnvelope(
        errorBody("destinations.unsupported_reference", "Only the destinations the app supports can be tracked."),
      ),
    };
  }

  return { status: 201, body: toTrackedDestinationJson(result.destination) };
}
