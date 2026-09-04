import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import { LinkedIdentitiesRepository } from "./linked-identities-repository";
import { UsersRepository } from "./users-repository";

let client: PGlite;
let repository: LinkedIdentitiesRepository;
let users: UsersRepository;

beforeEach(async () => {
  client = new PGlite();
  const db = drizzle(client, { schema });
  for (const file of ["0000_panoramic_paladin.sql", "0001_add_linked_identities.sql"]) {
    const migrationSql = readFileSync(path.resolve(__dirname, "../../../../drizzle", file), "utf-8");
    await client.exec(migrationSql);
  }
  repository = new LinkedIdentitiesRepository(db);
  users = new UsersRepository(db);
});

afterEach(async () => {
  await client.close();
});

describe("LinkedIdentitiesRepository", () => {
  it("findCanonicalUserId returns null when no mapping exists", async () => {
    expect(await repository.findCanonicalUserId("user_no_mapping")).toBeNull();
  });

  it("link then findCanonicalUserId returns the canonical id, durably (a fresh repository instance still sees it)", async () => {
    await users.upsertById({ id: "user_canonical", email: "traveler@example.test" });
    await repository.link("user_second_identity", "user_canonical");

    const freshRepository = new LinkedIdentitiesRepository(drizzle(client, { schema }));
    expect(await freshRepository.findCanonicalUserId("user_second_identity")).toBe("user_canonical");
  });

  it("link is idempotent for a repeat call with the same identity", async () => {
    await users.upsertById({ id: "user_canonical", email: "traveler@example.test" });
    await repository.link("user_second_identity", "user_canonical");
    await repository.link("user_second_identity", "user_canonical");

    expect(await repository.findCanonicalUserId("user_second_identity")).toBe("user_canonical");
  });

  it("invalidate removes a mapping so a later findCanonicalUserId returns null", async () => {
    await users.upsertById({ id: "user_canonical", email: "traveler@example.test" });
    await repository.link("user_second_identity", "user_canonical");

    await repository.invalidate("user_second_identity");

    expect(await repository.findCanonicalUserId("user_second_identity")).toBeNull();
  });

  it("invalidate on an identity with no mapping is a no-op, not an error", async () => {
    await expect(repository.invalidate("user_never_linked")).resolves.toBeUndefined();
  });

  it("invalidate also clears mappings keyed by canonicalUserId, not only identityId", async () => {
    await users.upsertById({ id: "user_canonical", email: "traveler@example.test" });
    await repository.link("user_second_identity", "user_canonical");

    // The canonical account's own Clerk profile changed — every identity mapped to it
    // was justified by its old email, so those mappings must clear too, not just a
    // mapping keyed by "user_canonical" as an identityId (which never exists).
    await repository.invalidate("user_canonical");

    expect(await repository.findCanonicalUserId("user_second_identity")).toBeNull();
  });
});
