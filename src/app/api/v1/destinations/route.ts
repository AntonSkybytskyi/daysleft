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
    // A missing, null, or malformed body is not a server fault — it's a request naming no
    // supported destination reference, so it goes through the same AC-02 refusal as any other
    // unsupported reference rather than a generic 500 (dashboard-countries-list review finding).
    const input = (await request.json().catch(() => null)) as { destination_ref?: unknown } | null;
    const destinationRef = typeof input?.destination_ref === "string" ? input.destination_ref : "";
    const { status, body } = await handleAddDestination(deps, { destination_ref: destinationRef });
    return NextResponse.json(body, { status });
  } catch (error) {
    const { status, body } = mapUnknownError(error);
    return NextResponse.json(body, { status });
  }
}
