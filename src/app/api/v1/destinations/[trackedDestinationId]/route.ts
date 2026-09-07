import { NextResponse, type NextRequest } from "next/server";
import { createDbClient } from "@/db/client";
import { mapUnknownError } from "@/lib/errors";
import { buildDestinationsDeps } from "@/modules/destinations/infra/destinations-deps";
import { handleGetDestination, handleRemoveDestination } from "./handlers";

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
