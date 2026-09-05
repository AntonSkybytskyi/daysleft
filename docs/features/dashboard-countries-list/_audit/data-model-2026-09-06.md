# Data-model audit — dashboard-countries-list — 2026-09-06

## Convention source

- `docs/architecture-map.md` line 10: `migration_tool: "drizzle-kit"`; line 67: "Migrations: `drizzle-kit` generated migrations under `drizzle/`, one migration per schema change, forward + down." No dedicated `## Migrations` section, so the naming pattern was corroborated from the live `drizzle/` tree instead (below).
- `sad.md §2/§5/§8` (ADR-0006, ADR-0008, ADR-0009): text PK / app-generated UUIDv7 / hard delete / catalogue validated app-side, not by the database.
- Live `drizzle/` tree: `0000_panoramic_paladin.sql`/`.down.sql`, `0001_add_linked_identities.sql`/`.down.sql` — text PKs, `timestamp with time zone DEFAULT now()`, no `updated_at` on `linked_identities`, FK added via a separate `DO $$ ... EXCEPTION WHEN duplicate_object` block, `IF NOT EXISTS` on every `CREATE TABLE`. This feature's staged SQL follows that pattern exactly — no divergence.

## Staged migrations (NOT in the live tree)

- `docs/features/dashboard-countries-list/migrations/01_create_tracked_destinations.up.sql`
- `docs/features/dashboard-countries-list/migrations/01_create_tracked_destinations.down.sql`

**Promote-time hint:** the repo's `drizzle/` sequence is sequential, currently at `0001`. `implement` should generate this migration via `pnpm db:generate` (or assign `0002_*` by hand if another feature has not already claimed it) at promotion time — not `01`, which is a feature-local ordinal only.

## Schema change

One new table, `tracked_destinations` — greenfield for this feature (no existing table to alter, no expand/backfill/contract needed).

## Drift detection

N/A this pass. The Explore-discovered domain layer for `src/modules/destinations/` does not exist yet — `sad.md §5`'s internal decomposition is a design (not yet built), so there is no existing struct/field source to diff against. Re-run `data-model --drift-only` after `implement` lands the module if the schema and the eventual repository code need re-reconciling.

## Self-check (4 mandatory)

| Check | Result |
|---|---|
| Naming matches repo convention | Pass — `snake_case` table/columns, matching `users` / `linked_identities`; file naming is the feature-local staging convention, reconciled with the live sequential pattern at promote-time (see hint above). |
| Down reversibility | Pass — the one `CREATE TABLE` has a matching `DROP TABLE`; the index drops implicitly with the table, same as the repo's existing migrations (no standalone `CREATE INDEX` is dropped independently anywhere in the live tree either). |
| FK indexes | Pass — `user_id REFERENCES users(id)` is the leading column of `idx_tracked_destinations_user_created`. |
| Convention adherence | Pass, with one deliberate divergence flagged: no `CHECK` constraint validates `destination_ref` against the five-entry catalogue. This matches the repo (neither existing table uses `CHECK`) and is a SAD decision, not an oversight — ADR-0006 puts that refusal in the app layer so it holds for every request, however it arrives, not only for what a `CHECK` could express against a value list. `sad.md §11` already carries this as an accepted, tracked risk. |

## `<!-- TBD -->` items

None. Every column, constraint and index was resolvable from `sad.md` + the repo's existing conventions with no open design choice.

## Next stage

`/sdd:api dashboard-countries-list` — this feature has a real schema change (`tracked_destinations`), so `api` is not skipped.
