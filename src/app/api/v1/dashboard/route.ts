import { NextResponse, type NextRequest } from "next/server";
import { createDbClient } from "@/db/client";
import { buildSessionDeps } from "@/modules/auth/infra/session-deps";
import { getDashboard, DASHBOARD_PATH } from "@/modules/dashboard/app/get-dashboard";
import { resolveReturnTo } from "@/modules/auth/app/return-to";
import { mapUnknownError, toErrorEnvelope } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const db = createDbClient();
    const rawPath = request.nextUrl.searchParams.get("path");
    const requestedPath = rawPath ? resolveReturnTo(rawPath, request.nextUrl.origin, DASHBOARD_PATH) : undefined;
    const result = await getDashboard(buildSessionDeps(db), requestedPath);
    const body = result.status === 200 ? result.body : toErrorEnvelope(result.body);
    return NextResponse.json(body, { status: result.status });
  } catch (error) {
    const { status, body } = mapUnknownError(error);
    return NextResponse.json(body, { status });
  }
}
