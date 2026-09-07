import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { QueryClient } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as schema from "@/db/schema";
import { newId } from "@/lib/id";
import { destinationsQueryKey, addDestinationMutationOptions, type DestinationsData } from "./app/destinations-query";
import { TrackedDestinationsRepository } from "./infra/tracked-destinations-repository";
import { DestinationListDrawer } from "./ui/DestinationListDrawer";
import { DestinationPicker } from "./ui/DestinationPicker";
import { RemoveConfirmation } from "./ui/RemoveConfirmation";

describe("ordering equivalence (sad.md §11): freshly read list matches the client-spliced list after an add", () => {
  let client: PGlite;
  let repository: TrackedDestinationsRepository;

  beforeEach(async () => {
    client = new PGlite();
    const db = drizzle(client, { schema });
    for (const tag of ["0000_panoramic_paladin", "0002_new_scarlet_witch"]) {
      const migrationSql = readFileSync(path.resolve(__dirname, `../../../drizzle/${tag}.sql`), "utf-8");
      await client.exec(migrationSql);
    }
    await client.exec(`insert into users (id, email) values ('user_1', 'one@example.com')`);
    repository = new TrackedDestinationsRepository(db);
  });

  afterEach(async () => {
    await client.close();
  });

  it("matches after adding to a cache seeded from an earlier read", async () => {
    await repository.insert({ id: newId(), userId: "user_1", destinationRef: "thailand" });
    await repository.insert({ id: newId(), userId: "user_1", destinationRef: "vietnam" });

    const initialRead = await repository.listForOwner("user_1");
    const queryClient = new QueryClient();
    const key = destinationsQueryKey("user_1");
    queryClient.setQueryData<DestinationsData>(key, {
      items: initialRead.map((row) => ({
        id: row.id,
        destination_ref: row.destinationRef,
        created_at: row.createdAt.toISOString(),
      })),
    });

    const created = await repository.insert({ id: newId(), userId: "user_1", destinationRef: "malaysia" });
    const options = addDestinationMutationOptions(queryClient, "user_1");
    await options.onSuccess?.(
      { id: created.id, destination_ref: created.destinationRef, created_at: created.createdAt.toISOString() },
      { destination_ref: "malaysia" },
      undefined,
      {} as never,
    );

    const splicedIds = queryClient.getQueryData<DestinationsData>(key)?.items.map((item) => item.id);
    const freshIds = (await repository.listForOwner("user_1")).map((row) => row.id);

    expect(splicedIds).toEqual(freshIds);
  });
});

describe("timing (sad.md §11, stubbed network)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("a list read completes within 500ms and a confirmed add/removal within 800ms", async () => {
    const respond = (status: number, body: unknown, delayMs: number) =>
      new Promise((resolve) =>
        setTimeout(() => resolve({ status, ok: status >= 200 && status < 300, json: async () => body }), delayMs),
      );

    const fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === "POST") return respond(201, { id: "d1", destination_ref: "thailand", created_at: "x" }, 50);
      if (init?.method === "DELETE") return respond(204, undefined, 50);
      return respond(200, { items: [] }, 50);
    });
    vi.stubGlobal("fetch", fetchMock);

    const { destinationsQueryOptions, removeDestinationMutationOptions } = await import("./app/destinations-query");

    const readStart = performance.now();
    await (destinationsQueryOptions("user_1").queryFn as () => Promise<unknown>)();
    expect(performance.now() - readStart).toBeLessThan(500);

    const queryClient = new QueryClient();
    const addStart = performance.now();
    await addDestinationMutationOptions(queryClient, "user_1").mutationFn!(
      { destination_ref: "thailand" },
      {} as never,
    );
    expect(performance.now() - addStart).toBeLessThan(800);

    const removeStart = performance.now();
    await removeDestinationMutationOptions(queryClient, "user_1").mutationFn!("d1", {} as never);
    expect(performance.now() - removeStart).toBeLessThan(800);
  });
});

describe("accessibility (sad.md §10 QG-2): all three overlay surfaces together", () => {
  it("reports 0 serious/critical axe violations", async () => {
    const destinations = [{ id: "d1", destination_ref: "thailand", created_at: "2026-01-01T00:00:00Z" }];

    const { container } = render(
      <div>
        <DestinationListDrawer destinations={destinations} selectedId="d1" onSelect={vi.fn()} onAdd={vi.fn()} />
        <DestinationPicker onAdd={vi.fn()} onClose={vi.fn()} />
        <RemoveConfirmation destinationName="Thailand" onConfirm={vi.fn()} onClose={vi.fn()} />
      </div>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
