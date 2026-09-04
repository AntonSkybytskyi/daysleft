import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import { UsersRepository } from "./users-repository";

let client: PGlite;
let repository: UsersRepository;

beforeEach(async () => {
  client = new PGlite();
  const db = drizzle(client, { schema });
  const migrationSql = readFileSync(
    path.resolve(__dirname, "../../../../drizzle/0000_panoramic_paladin.sql"),
    "utf-8",
  );
  await client.exec(migrationSql);
  repository = new UsersRepository(db);
});

afterEach(async () => {
  await client.close();
});

describe("UsersRepository", () => {
  it("findByEmail returns null when no row matches", async () => {
    expect(await repository.findByEmail("nobody@example.com")).toBeNull();
  });

  it("findById returns null when no row matches", async () => {
    expect(await repository.findById("user_missing")).toBeNull();
  });

  it("upsertById inserts a new row, then findById/findByEmail see it", async () => {
    const result = await repository.upsertById({ id: "user_1", email: "one@example.com" });

    expect(result).toMatchObject({ kind: "ok", user: { id: "user_1", email: "one@example.com" } });
    expect(await repository.findById("user_1")).toMatchObject({ email: "one@example.com" });
    expect(await repository.findByEmail("one@example.com")).toMatchObject({ id: "user_1" });
  });

  it("upsertById on an existing id updates the email in place", async () => {
    await repository.upsertById({ id: "user_1", email: "one@example.com" });

    const result = await repository.upsertById({ id: "user_1", email: "one-new@example.com" });

    expect(result).toMatchObject({ kind: "ok", user: { id: "user_1", email: "one-new@example.com" } });
    expect(await repository.findByEmail("one@example.com")).toBeNull();
  });

  it("upsertById reports an email_conflict when a different id already owns that email", async () => {
    await repository.upsertById({ id: "user_1", email: "shared@example.com" });

    const result = await repository.upsertById({ id: "user_2", email: "shared@example.com" });

    expect(result).toEqual({ kind: "email_conflict" });
  });
});
