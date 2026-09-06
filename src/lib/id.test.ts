import { describe, expect, it } from "vitest";
import { newId } from "./id";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("newId", () => {
  it("generates a valid UUIDv7 (version and variant bits correct)", () => {
    const id = newId();
    expect(id).toMatch(UUID_RE);
  });

  it("sorts lexicographically in generation order (time-sortable)", async () => {
    const ids: string[] = [];
    for (let i = 0; i < 20; i++) {
      ids.push(newId());
      await new Promise((resolve) => setTimeout(resolve, 2));
    }

    const sorted = [...ids].sort();
    expect(ids).toEqual(sorted);
  });

  it("generates no collisions across 10k ids", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 10_000; i++) {
      ids.add(newId());
    }

    expect(ids.size).toBe(10_000);
  });
});
