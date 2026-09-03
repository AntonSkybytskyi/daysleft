import { NextResponse } from "next/server";
import { createDbClient } from "@/db/client";
import { buildSessionDeps } from "@/modules/auth/infra/session-deps";
import { getDashboard } from "@/modules/dashboard/app/get-dashboard";

export async function GET() {
  const db = createDbClient(process.env.DATABASE_URL ?? "");
  const result = await getDashboard(buildSessionDeps(db));
  return NextResponse.json(result.body, { status: result.status });
}
