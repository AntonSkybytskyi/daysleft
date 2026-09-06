import { NextResponse, type NextRequest } from "next/server";
import { createDbClient } from "@/db/client";
import { errorBody, mapUnknownError, toErrorEnvelope } from "@/lib/errors";
import { getTrackedDestination } from "@/modules/destinations/app/get-tracked-destination";
import { removeTrackedDestination } from "@/modules/destinations/app/remove-tracked-destination";
import { buildDestinationsDeps, type DestinationsDeps } from "@/modules/destinations/infra/destinations-deps";
import type { TrackedDestination } from "@/modules/destinations/infra/tracked-destinations-repository";

type RouteResult<T> = { status: number; body: T };

function toTrackedDestinationJson(row: TrackedDestination) {
  return {
    id: row.id,
    destination_ref: row.destinationRef,
    created_at: row.createdAt.toISOString(),
  };
}

const NOT_FOUND_BODY = toErrorEnvelope(errorBody("destinations.not_found", "That destination isn't available."));

export async function handleGetDestination(
  deps: DestinationsDeps,
  trackedDestinationId: string,
): Promise<RouteResult<ReturnType<typeof toTrackedDestinationJson> | { error: ReturnType<typeof errorBody> }>> {
  const userId = await deps.getAuthUserId();
  if (!userId) {
    return {
      status: 401,
      body: toErrorEnvelope(errorBody("auth.session_invalid", "Sign in to view this tracked destination.")),
    };
  }

  const result = await getTrackedDestination(deps, { id: trackedDestinationId, userId });
  if (result.kind === "not_found") {
    return { status: 404, body: NOT_FOUND_BODY };
  }

  return { status: 200, body: toTrackedDestinationJson(result.destination) };
}

export async function handleRemoveDestination(
  deps: DestinationsDeps,
  trackedDestinationId: string,
): Promise<RouteResult<{ error: ReturnType<typeof errorBody> } | undefined>> {
  const userId = await deps.getAuthUserId();
  if (!userId) {
    return {
      status: 401,
      body: toErrorEnvelope(errorBody("auth.session_invalid", "Sign in to manage your tracked destinations.")),
    };
  }

  const result = await removeTrackedDestination(deps, { id: trackedDestinationId, userId });
  if (result.kind === "not_found") {
    return { status: 404, body: NOT_FOUND_BODY };
  }
  if (result.kind === "not_removed") {
    return {
      status: 500,
      body: toErrorEnvelope(errorBody("internal.unexpected", "Something went wrong.")),
    };
  }

  return { status: 204, body: undefined };
}

export async function GET(_request: NextRequest, { params }: { params: { trackedDestinationId: string } }) {
  try {
    const deps = buildDestinationsDeps(createDbClient());
    const { status, body } = await handleGetDestination(deps, params.trackedDestinationId);
    return NextResponse.json(body, { status });
  } catch (error) {
    const { status, body } = mapUnknownError(error);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { trackedDestinationId: string } }) {
  try {
    const deps = buildDestinationsDeps(createDbClient());
    const { status, body } = await handleRemoveDestination(deps, params.trackedDestinationId);
    return status === 204 ? new NextResponse(null, { status }) : NextResponse.json(body, { status });
  } catch (error) {
    const { status, body } = mapUnknownError(error);
    return NextResponse.json(body, { status });
  }
}
