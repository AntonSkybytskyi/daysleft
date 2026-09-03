import { NextResponse, type NextRequest } from "next/server";
import { getClerkWebhookSecret } from "@/modules/auth/infra/clerk-client";
import { createDbClient } from "@/db/client";
import { UsersRepository } from "@/modules/auth/infra/users-repository";
import { createInMemoryDedupeStore, handleClerkWebhook } from "@/modules/auth/infra/routes/clerk-webhook";

const dedupeStore = createInMemoryDedupeStore();

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
    { webhookSecret: getClerkWebhookSecret(), repository, dedupeStore },
  );

  return NextResponse.json(result.body, { status: result.status });
}
