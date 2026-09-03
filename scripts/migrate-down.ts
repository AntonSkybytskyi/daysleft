import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

type JournalEntry = { tag: string; when: number };
type Journal = { entries: JournalEntry[] };

export type RevertTarget = {
  tag: string;
  downSql: string;
  // drizzle-orm's postgres-js migrator keys its journal table (drizzle.__drizzle_migrations) by
  // `created_at`, set from this same journal entry's `when` — not by tag/hash — so this is the
  // value the DELETE must match to actually remove the row migrate() would otherwise still see.
  journalWhen: number;
};

// Drizzle's migrate() tracks applied "up" migrations for us, but ships no down-migration
// runner — this reverts the most recently applied entry using its paired *.down.sql file,
// per CLAUDE.md's "one migration per schema change, forward + down".
export function resolveRevertTarget(migrationsDir: string): RevertTarget | null {
  const journalPath = path.resolve(migrationsDir, "meta", "_journal.json");
  const journal = JSON.parse(readFileSync(journalPath, "utf-8")) as Journal;
  const last = journal.entries.at(-1);
  if (!last) {
    return null;
  }

  const downPath = path.resolve(migrationsDir, `${last.tag}.down.sql`);
  if (!existsSync(downPath)) {
    throw new Error(`No down migration found for ${last.tag} at ${downPath}`);
  }

  return { tag: last.tag, downSql: readFileSync(downPath, "utf-8"), journalWhen: last.when };
}

// Matches the real table drizzle-orm's postgres-js migrate() writes to (schema "drizzle", table
// "__drizzle_migrations") and the real key it writes (created_at, from the journal entry's
// `when`) — verified against drizzle-orm's own pg-core/dialect.js and migrator.js. `createdAt`
// is a trusted internal journal timestamp (never user input), so plain interpolation is fine —
// this stays a single exec() call so both the CLI and the test run the exact same SQL text.
export function deleteJournalRowSql(createdAt: number): string {
  return `delete from "drizzle"."__drizzle_migrations" where created_at = ${createdAt}`;
}

export async function applyRevert(target: RevertTarget, exec: (sql: string) => Promise<unknown>): Promise<void> {
  await exec(target.downSql);
  await exec(deleteJournalRowSql(target.journalWhen));
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const target = resolveRevertTarget(path.resolve(process.cwd(), "drizzle"));
  if (!target) {
    console.log("No migrations recorded — nothing to revert.");
    return;
  }

  const client = postgres(connectionString, { max: 1 });
  try {
    await applyRevert(target, (sql) => client.unsafe(sql));
    console.log(`Reverted ${target.tag}.`);
  } finally {
    await client.end();
  }
}

const isMainModule = process.argv[1] !== undefined && process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
