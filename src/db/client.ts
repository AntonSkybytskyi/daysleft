import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function buildDbClient(connectionString: string) {
  const queryClient = postgres(connectionString);
  return drizzle(queryClient, { schema });
}

const cachedClients = new Map<string, ReturnType<typeof buildDbClient>>();

export function createDbClient(connectionString: string | undefined = process.env.DATABASE_URL) {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  let client = cachedClients.get(connectionString);
  if (!client) {
    client = buildDbClient(connectionString);
    cachedClients.set(connectionString, client);
  }
  return client;
}

export type Db = ReturnType<typeof createDbClient>;
