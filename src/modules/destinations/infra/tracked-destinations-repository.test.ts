import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import { newId } from "@/lib/id";
import { TrackedDestinationsRepository } from "./tracked-destinations-repository";

let client: PGlite;
let repository: TrackedDestinationsRepository;

beforeEach(async () => {
  client = new PGlite();
  const db = drizzle(client, { schema });
  for (const tag of ["0000_panoramic_paladin", "0002_new_scarlet_witch"]) {
    const migrationSql = readFileSync(path.resolve(__dirname, `../../../../drizzle/${tag}.sql`), "utf-8");
    await client.exec(migrationSql);
  }
  await client.exec(
    `insert into users (id, email) values ('user_1', 'one@example.com'), ('user_2', 'two@example.com')`,
  );
  repository = new TrackedDestinationsRepository(db);
});

afterEach(async () => {
  await client.close();
});

describe("TrackedDestinationsRepository", () => {
  it("insert records a row that findByIdForOwner then returns", async () => {
    const id = newId();
    const inserted = await repository.insert({ id, userId: "user_1", destinationRef: "thailand" });

    expect(inserted).toMatchObject({ id, userId: "user_1", destinationRef: "thailand" });
    expect(await repository.findByIdForOwner(id, "user_1")).toMatchObject({ id, destinationRef: "thailand" });
  });

  it("findByIdForOwner returns null for another owner's record (zero rows, not a different error)", async () => {
    const id = newId();
    await repository.insert({ id, userId: "user_1", destinationRef: "thailand" });

    expect(await repository.findByIdForOwner(id, "user_2")).toBeNull();
  });

  it("findByIdForOwner returns null for a never-existed id", async () => {
    expect(await repository.findByIdForOwner(newId(), "user_1")).toBeNull();
  });

  it("deleteByIdForOwner removes the row for its owner and returns it", async () => {
    const id = newId();
    await repository.insert({ id, userId: "user_1", destinationRef: "thailand" });

    const deleted = await repository.deleteByIdForOwner(id, "user_1");

    expect(deleted).toMatchObject({ id });
    expect(await repository.findByIdForOwner(id, "user_1")).toBeNull();
  });

  it("deleteByIdForOwner returns null and leaves the row intact for another owner", async () => {
    const id = newId();
    await repository.insert({ id, userId: "user_1", destinationRef: "thailand" });

    expect(await repository.deleteByIdForOwner(id, "user_2")).toBeNull();
    expect(await repository.findByIdForOwner(id, "user_1")).toMatchObject({ id });
  });

  it("deleteByIdForOwner returns null for a never-existed id", async () => {
    expect(await repository.deleteByIdForOwner(newId(), "user_1")).toBeNull();
  });

  it("listForOwner returns rows ordered by created_at then id, scoped to the owner", async () => {
    const early = new Date("2026-01-01T00:00:00Z");
    const late = new Date("2026-01-02T00:00:00Z");
    const idA = "018f0000-0000-7000-8000-00000000000a";
    const idB = "018f0000-0000-7000-8000-00000000000b";
    const idC = "018f0000-0000-7000-8000-00000000000c";

    await repository.insert({ id: idB, userId: "user_1", destinationRef: "vietnam", createdAt: early });
    await repository.insert({ id: idA, userId: "user_1", destinationRef: "malaysia", createdAt: early });
    await repository.insert({ id: idC, userId: "user_1", destinationRef: "indonesia", createdAt: late });
    await repository.insert({ id: newId(), userId: "user_2", destinationRef: "schengen", createdAt: early });

    const rows = await repository.listForOwner("user_1");

    expect(rows.map((row) => row.id)).toEqual([idA, idB, idC]);
  });
});
