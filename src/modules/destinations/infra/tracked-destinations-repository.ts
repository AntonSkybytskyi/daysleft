import { and, asc, eq } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { trackedDestinations } from "@/db/schema";

export type TrackedDestination = typeof trackedDestinations.$inferSelect;
export type InsertTrackedDestinationInput = {
  id: string;
  userId: string;
  destinationRef: string;
  createdAt?: Date;
};

type AnyPgDatabase = PgDatabase<PgQueryResultHKT, Record<string, unknown>>;

export class TrackedDestinationsRepository {
  constructor(private readonly db: AnyPgDatabase) {}

  async insert(input: InsertTrackedDestinationInput): Promise<TrackedDestination> {
    const [row] = await this.db
      .insert(trackedDestinations)
      .values({
        id: input.id,
        userId: input.userId,
        destinationRef: input.destinationRef,
        ...(input.createdAt ? { createdAt: input.createdAt } : {}),
      })
      .returning();
    return row;
  }

  // Ownership is checked in the same WHERE, not a second lookup — what keeps not-yours /
  // removed / never-existed indistinguishable (ADR-0008).
  async findByIdForOwner(id: string, userId: string): Promise<TrackedDestination | null> {
    const rows = await this.db
      .select()
      .from(trackedDestinations)
      .where(and(eq(trackedDestinations.id, id), eq(trackedDestinations.userId, userId)))
      .limit(1);
    return rows[0] ?? null;
  }

  async deleteByIdForOwner(id: string, userId: string): Promise<TrackedDestination | null> {
    const rows = await this.db
      .delete(trackedDestinations)
      .where(and(eq(trackedDestinations.id, id), eq(trackedDestinations.userId, userId)))
      .returning();
    return rows[0] ?? null;
  }

  async listForOwner(userId: string): Promise<TrackedDestination[]> {
    return this.db
      .select()
      .from(trackedDestinations)
      .where(eq(trackedDestinations.userId, userId))
      .orderBy(asc(trackedDestinations.createdAt), asc(trackedDestinations.id));
  }
}
