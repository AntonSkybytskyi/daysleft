import { eq } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { users } from "@/db/schema";

export type User = typeof users.$inferSelect;
export type UpsertUserInput = { id: string; email: string };
export type UpsertUserResult =
  | { kind: "ok"; user: User }
  | { kind: "email_conflict" };

type AnyPgDatabase = PgDatabase<PgQueryResultHKT, Record<string, unknown>>;

const UNIQUE_VIOLATION = "23505";

export class UsersRepository {
  constructor(private readonly db: AnyPgDatabase) {}

  async findByEmail(email: string): Promise<User | null> {
    const rows = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return rows[0] ?? null;
  }

  async findById(id: string): Promise<User | null> {
    const rows = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return rows[0] ?? null;
  }

  async upsertById(input: UpsertUserInput): Promise<UpsertUserResult> {
    try {
      const [row] = await this.db
        .insert(users)
        .values({ id: input.id, email: input.email })
        .onConflictDoUpdate({
          target: users.id,
          set: { email: input.email, updatedAt: new Date() },
        })
        .returning();
      return { kind: "ok", user: row };
    } catch (error) {
      if (isUniqueViolation(error)) {
        return { kind: "email_conflict" };
      }
      throw error;
    }
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === UNIQUE_VIOLATION
  );
}
