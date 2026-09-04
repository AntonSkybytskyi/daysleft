---
status: Accepted
date: 2026-09-02
---

# 0003 — Persistence: Drizzle ORM + drizzle-kit migrations, UUIDv7 ids

## Context

daysleft is offline-first: trips/stays can be created on-device while offline and synced to
Postgres later. The persistence layer needs type-safe queries matching the TypeScript stack,
straightforward migrations, and an ID strategy that works when records are created outside
the database (offline) and merged in later.

## Decision drivers

- IDs must be assignable client-side (offline creation) without collision risk
- Time-sortable IDs help with a date-heavy domain (trips/stays ordered by date)
- Type-safe query layer matching the TypeScript stack
- Lightweight migration tooling, no heavyweight schema DSL/runtime needed

## Considered options

- **Drizzle ORM + drizzle-kit migrations + UUIDv7 (app-generated)** — chosen
- Prisma + Prisma Migrate + autoincrement ids — batteries-included but autoincrement ids require
  server round-trip before an offline-created record has a stable id, complicating sync

## Outcome

Use Drizzle ORM for all database access (`src/db/`), `drizzle-kit` for migrations, and
app-generated UUIDv7 identifiers for all sync-relevant records (trips, stays, users).

## Consequences

- Good: offline-created records get a stable, globally-unique, time-sortable id at creation time —
  no server round-trip needed before the record can be referenced
- Good: Drizzle's SQL-like query builder keeps DB access explicit and type-safe without a heavy
  ORM runtime
- Bad: UUIDv7 requires a small app-side library/util (no native `gen_random_uuid()` v7 support in
  Postgres yet) — accepted as a one-time setup cost
