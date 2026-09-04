import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Maps a second Clerk identity that account-linking-by-email resolved onto the canonical
// `users` row it resolved to (the `users` table holds one row per email, so the second identity
// can never get its own row). Durable across instances/restarts, unlike an in-process cache.
export const linkedIdentities = pgTable("linked_identities", {
  identityId: text("identity_id").primaryKey(),
  canonicalUserId: text("canonical_user_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
