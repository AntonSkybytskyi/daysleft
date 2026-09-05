---
id: T2
title: "Add the shared UUIDv7 id-generation helper"
layer: "infra"
deps: []
acs: ["AC-01"]
files_hint: ["src/lib/id.ts", "src/lib/id.test.ts"]
owner: "Tech Lead"
estimate: "S"
status: "todo"
---

# T2 — Add the shared UUIDv7 id-generation helper

## Why

`CLAUDE.md` mandates app-side UUIDv7 ids; this feature is the repository's first consumer
([sad.md §8](../sad.md) "ID strategy", ADR-0009).

## What

Add `src/lib/id.ts` exporting a `newId()` (or similarly named) function generating UUIDv7 values.
No existing helper to build on — this is new.

## Definition of Done

- [ ] unit tests assert generated ids are valid UUIDv7 (version/variant bits correct)
- [ ] unit tests assert ids generated in sequence sort lexicographically the same as their
      generation order (time-sortability, which the ordering rule at `sad.md §8` relies on)
- [ ] no collisions across 10k generated ids in a test run
- [ ] lint + vet clean

## Notes

Parallel with T1 and T3 — no shared files.
