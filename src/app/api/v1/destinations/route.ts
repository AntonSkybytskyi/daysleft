import { NextResponse, type NextRequest } from "next/server";
import { createDbClient } from "@/db/client";
import { mapUnknownError } from "@/lib/errors";
import { buildDestinationsDeps } from "@/modules/destinations/infra/destinations-deps";
import { handleAddDestination, handleListDestinations } from "./handlers";

export async function GET() {
  try {
    const deps = buildDestinationsDeps(createDbClient());
    const { status, body } = await handleListDestinations(deps);
    return NextResponse.json(body, { status });
  } catch (error) {
    const { status, body } = mapUnknownError(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const deps = buildDestinationsDeps(createDbClient());
    const input = (await request.json()) as { destination_ref: string };
    const { status, body } = await handleAddDestination(deps, input);
    return NextResponse.json(body, { status });
  } catch (error) {
    const { status, body } = mapUnknownError(error);
    return NextResponse.json(body, { status });
  }
}
