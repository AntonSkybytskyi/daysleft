import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const _placeholder = pgTable("_placeholder", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
