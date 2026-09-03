import { NextResponse, type NextRequest } from "next/server";
import { getClerkWebhookSecret } from "@/modules/auth/infra/clerk-client";
import { createDbClient } from "@/db/client";
import { UsersRepository } from "@/modules/auth/infra/users-repository";
import { handleClerkWebhook } from "@/modules/auth/infra/routes/clerk-webhook";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const headers = {
    "svix-id": request.headers.get("svix-id") ?? "",
    "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
    "svix-signature": request.headers.get("svix-signature") ?? "",
  };

  const db = createDbClient(process.env.DATABASE_URL ?? "");
  const repository = new UsersRepository(db);

  const result = await handleClerkWebhook(
    { headers, rawBody },
    { webhookSecret: getClerkWebhookSecret(), repository },
  );

  return NextResponse.json(result.body, { status: result.status });
}
