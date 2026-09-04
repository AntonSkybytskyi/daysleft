import { NextResponse, type NextRequest } from "next/server";
import { getClerkWebhookSecret } from "@/modules/auth/infra/clerk-client";
import { createDbClient } from "@/db/client";
import { UsersRepository } from "@/modules/auth/infra/users-repository";
import { LinkedIdentitiesRepository } from "@/modules/auth/infra/linked-identities-repository";
import { createInMemoryDedupeStore, handleClerkWebhook } from "@/modules/auth/infra/routes/clerk-webhook";
import { mapUnknownError, toErrorEnvelope, type ErrorBody } from "@/lib/errors";

const dedupeStore = createInMemoryDedupeStore();

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const headers = {
      "svix-id": request.headers.get("svix-id") ?? "",
      "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
      "svix-signature": request.headers.get("svix-signature") ?? "",
    };

    const db = createDbClient();
    const repository = new UsersRepository(db);
    const linkedIdentities = new LinkedIdentitiesRepository(db);

    const result = await handleClerkWebhook(
      { headers, rawBody },
      { webhookSecret: getClerkWebhookSecret(), repository, linkedIdentities, dedupeStore },
    );

    const body = result.status === 200 ? result.body : toErrorEnvelope(result.body as ErrorBody);
    return NextResponse.json(body, { status: result.status });
  } catch (error) {
    const { status, body } = mapUnknownError(error);
    return NextResponse.json(body, { status });
  }
}
