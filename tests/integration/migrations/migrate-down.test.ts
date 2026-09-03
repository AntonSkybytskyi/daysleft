import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resolveRevertTarget } from "../../../scripts/migrate-down";

const migrationsDir = path.resolve(__dirname, "../../../drizzle");

type JournalEntry = { tag: string; when: number };

function journalEntries(): JournalEntry[] {
  const journal = JSON.parse(readFileSync(path.resolve(migrationsDir, "meta", "_journal.json"), "utf-8")) as {
    entries: JournalEntry[];
  };
  return journal.entries;
}

// The table the *last* migration's own up.sql creates (and its down.sql drops) — read from the
// down SQL rather than hardcoded, so this test doesn't need updating every time a migration is
// added on top.
function droppedTableName(downSql: string): string {
  const match = downSql.match(/DROP TABLE IF EXISTS "([^"]+)"/i);
  if (!match) {
    throw new Error(`couldn't find a dropped table name in: ${downSql}`);
  }
  return match[1];
}

let client: PGlite;

beforeEach(async () => {
  client = new PGlite();
  // Replicates exactly what drizzle-orm's postgres-js migrate() does on a fresh database
  // (drizzle-orm/pg-core/dialect.js): create the drizzle.__drizzle_migrations journal table,
  // run this migration's up SQL, then record the journal row keyed by created_at = journal `when`.
  await client.exec(`CREATE SCHEMA IF NOT EXISTS "drizzle"`);
  await client.exec(`
    CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `);
});

afterEach(async () => {
  await client.close();
});

async function tableExists(name: string): Promise<boolean> {
  const result = await client.query<{ exists: boolean }>(
    `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = $1) AS exists`,
    [name],
  );
  return Boolean(result.rows[0]?.exists);
}

async function journalRowCount(): Promise<number> {
  const result = await client.query<{ count: string }>(`SELECT COUNT(*) AS count FROM "drizzle"."__drizzle_migrations"`);
  return Number(result.rows[0]?.count ?? 0);
}

describe("migrate-down round trip (up -> down -> up)", () => {
  it("resolveRevertTarget finds this repo's last migration's down.sql and its journal `when`", () => {
    const entries = journalEntries();
    const target = resolveRevertTarget(migrationsDir);

    expect(target).not.toBeNull();
    expect(target?.tag).toBe(entries.at(-1)?.tag);
    expect(target?.downSql).toContain("DROP TABLE");
    expect(target?.journalWhen).toBe(entries.at(-1)?.when);
  });

  it("db:down actually removes the journal row (not a silent no-op), so a subsequent db:up re-applies and restores the last migration's table", async () => {
    const target = resolveRevertTarget(migrationsDir);
    if (!target) {
      throw new Error("expected a revert target for this repo's real migrations");
    }
    const table = droppedTableName(target.downSql);

    // Apply every migration in journal order — including earlier ones the last migration's own
    // up.sql may depend on (e.g. an FK to a table an earlier migration created) — recording each
    // journal row exactly as drizzle-orm's migrate() does.
    for (const entry of journalEntries()) {
      const upSql = readFileSync(path.resolve(migrationsDir, `${entry.tag}.sql`), "utf-8");
      await client.exec(upSql);
      await client.query(`INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at) VALUES ($1, $2)`, [
        "fake-hash-for-test",
        entry.when,
      ]);
    }
    expect(await tableExists(table)).toBe(true);
    const rowCountAfterUp = await journalRowCount();

    // --- down (this is the fix under test: the real bug left the journal row in place) ---
    await client.exec(target.downSql);
    await client.query(`DELETE FROM "drizzle"."__drizzle_migrations" WHERE created_at = $1`, [target.journalWhen]);

    expect(await tableExists(table)).toBe(false);
    expect(await journalRowCount()).toBe(rowCountAfterUp - 1);

    // --- up again: mirrors drizzle-orm's own re-apply condition (pg-core/dialect.js) —
    // `!lastDbMigration || Number(lastDbMigration.created_at) < migration.folderMillis` — which
    // is only true once the journal row is actually gone.
    const lastUpSql = readFileSync(path.resolve(migrationsDir, `${target.tag}.sql`), "utf-8");
    await client.exec(lastUpSql);
    await client.query(`INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at) VALUES ($1, $2)`, [
      "fake-hash-for-test",
      target.journalWhen,
    ]);

    expect(await tableExists(table)).toBe(true);
  });
});
