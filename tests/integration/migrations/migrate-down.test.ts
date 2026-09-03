import { PGlite } from "@electric-sql/pglite";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resolveRevertTarget } from "../../../scripts/migrate-down";

const migrationsDir = path.resolve(__dirname, "../../../drizzle");

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
    const target = resolveRevertTarget(migrationsDir);

    expect(target).not.toBeNull();
    expect(target?.tag).toBe("0000_panoramic_paladin");
    expect(target?.downSql).toContain("DROP TABLE");
    expect(typeof target?.journalWhen).toBe("number");
  });

  it("db:down actually removes the journal row (not a silent no-op), so a subsequent db:up re-applies and restores the users table", async () => {
    const target = resolveRevertTarget(migrationsDir);
    if (!target) {
      throw new Error("expected a revert target for this repo's real migrations");
    }
    const upSql = await import("node:fs").then((fs) =>
      fs.readFileSync(path.resolve(migrationsDir, `${target.tag}.sql`), "utf-8"),
    );

    // --- up ---
    await client.exec(upSql);
    await client.query(`INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at) VALUES ($1, $2)`, [
      "fake-hash-for-test",
      target.journalWhen,
    ]);
    expect(await tableExists("users")).toBe(true);
    expect(await journalRowCount()).toBe(1);

    // --- down (this is the fix under test: the real bug left the journal row in place) ---
    await client.exec(target.downSql);
    await client.query(`DELETE FROM "drizzle"."__drizzle_migrations" WHERE created_at = $1`, [target.journalWhen]);

    expect(await tableExists("users")).toBe(false);
    expect(await journalRowCount()).toBe(0);

    // --- up again: mirrors drizzle-orm's own re-apply condition (pg-core/dialect.js) —
    // `!lastDbMigration || Number(lastDbMigration.created_at) < migration.folderMillis` — which
    // is only true once the journal row is actually gone.
    await client.exec(upSql);
    await client.query(`INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at) VALUES ($1, $2)`, [
      "fake-hash-for-test",
      target.journalWhen,
    ]);

    expect(await tableExists("users")).toBe(true);
  });
});
