import { eq } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { linkedIdentities } from "@/db/schema";

type AnyPgDatabase = PgDatabase<PgQueryResultHKT, Record<string, unknown>>;

export class LinkedIdentitiesRepository {
  constructor(private readonly db: AnyPgDatabase) {}

  async findCanonicalUserId(identityId: string): Promise<string | null> {
    const rows = await this.db
      .select({ canonicalUserId: linkedIdentities.canonicalUserId })
      .from(linkedIdentities)
      .where(eq(linkedIdentities.identityId, identityId))
      .limit(1);
    return rows[0]?.canonicalUserId ?? null;
  }

  async link(identityId: string, canonicalUserId: string): Promise<void> {
    await this.db.insert(linkedIdentities).values({ identityId, canonicalUserId }).onConflictDoNothing();
  }
}
