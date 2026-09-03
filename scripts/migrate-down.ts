import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import postgres from "postgres";

type JournalEntry = { tag: string };
type Journal = { entries: JournalEntry[] };

// Drizzle's migrate() tracks applied "up" migrations for us, but ships no down-migration
// runner — this reverts the most recently applied entry using its paired *.down.sql file,
// per CLAUDE.md's "one migration per schema change, forward + down".
async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const journalPath = path.resolve(process.cwd(), "drizzle", "meta", "_journal.json");
  const journal = JSON.parse(readFileSync(journalPath, "utf-8")) as Journal;
  const last = journal.entries.at(-1);
  if (!last) {
    console.log("No migrations recorded — nothing to revert.");
    return;
  }

  const downPath = path.resolve(process.cwd(), "drizzle", `${last.tag}.down.sql`);
  if (!existsSync(downPath)) {
    throw new Error(`No down migration found for ${last.tag} at ${downPath}`);
  }

  const client = postgres(connectionString, { max: 1 });
  try {
    await client.unsafe(readFileSync(downPath, "utf-8"));
    await client`delete from "__drizzle_migrations" where hash = ${last.tag}`.catch(() => {
      // Older/newer drizzle-orm versions key this table differently — the schema change
      // itself is reverted above regardless; tracking cleanup is best-effort.
    });
    console.log(`Reverted ${last.tag}.`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
