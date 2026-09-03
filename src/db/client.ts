import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function buildDbClient(connectionString: string) {
  const queryClient = postgres(connectionString);
  return drizzle(queryClient, { schema });
}

let cachedClient: ReturnType<typeof buildDbClient> | undefined;

export function createDbClient(connectionString: string | undefined = process.env.DATABASE_URL) {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!cachedClient) {
    cachedClient = buildDbClient(connectionString);
  }
  return cachedClient;
}

export type Db = ReturnType<typeof createDbClient>;
