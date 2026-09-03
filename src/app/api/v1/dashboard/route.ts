import { NextResponse, type NextRequest } from "next/server";
import { createDbClient } from "@/db/client";
import { buildSessionDeps } from "@/modules/auth/infra/session-deps";
import { getDashboard } from "@/modules/dashboard/app/get-dashboard";
import { resolveReturnTo } from "@/modules/dashboard/app/return-to";

export async function GET(request: NextRequest) {
  const db = createDbClient(process.env.DATABASE_URL ?? "");
  const rawPath = request.nextUrl.searchParams.get("path");
  const requestedPath = rawPath ? resolveReturnTo(rawPath, request.nextUrl.origin) : undefined;
  const result = await getDashboard(buildSessionDeps(db), requestedPath);
  return NextResponse.json(result.body, { status: result.status });
}
