---
date: "2026-09-02"
slug: auth-user-plus-dashboard
---

# Data-model audit — auth-user-plus-dashboard

## Staged migrations

Staged — **not** in the live tree. `implement` promotes these into `drizzle/` (real drizzle-kit
sequence number assigned at promote-time) when it runs the feature's `layer: migration` task.

- `docs/features/auth-user-plus-dashboard/migrations/01_create_users.up.sql`
- `docs/features/auth-user-plus-dashboard/migrations/01_create_users.down.sql`

**Promote-time convention hint:** the repo has no live `drizzle/` folder yet (greenfield, no code
materialized — `architecture-map.md` mode: `greenfield-bootstrap`). `implement` should generate the
real migration via `drizzle-kit generate` against a `users` table added to `src/db/schema.ts`,
which will assign drizzle-kit's own sequential/timestamped filename — next migration is effectively
`0000_*` since none exist yet.

## Convention sourcing

- **Migration tool:** `drizzle-kit`, from `architecture-map.md` frontmatter `migration_tool`.
- **PK strategy:** repo default is app-generated UUIDv7 (`architecture-map.md` §Conventions), but
  `users.id` **deliberately overrides** this — it's the Clerk-issued user id itself, per `sad.md`
  §8 crosscutting concepts, backed by ADR-0001 (Clerk as the auth solution). Flagged, not silent.
- **Audit columns / delete strategy / string type:** no repo convention exists to detect (greenfield,
  zero code) — confirmed directly with the user: `created_at` + `updated_at`, hard delete, `TEXT`
  for `email`.
- **No `CHECK` constraints / triggers:** repo has none to match yet; none added here — kept minimal
  until the repo establishes a pattern.

## Convention deviations

- Staged file naming (`01_create_users.up/.down.sql`) intentionally differs from the eventual live
  drizzle-kit filename — this is the skill's staging convention, not a repo-convention violation;
  resolved at promotion.

## Drift detection

N/A — greenfield repo, no domain layer or existing schema exists yet to diff against
(`architecture-map.md` mode: `greenfield-bootstrap`).

## Self-check (4 mandatory)

- **Naming:** table/column names (`users`, `id`, `email`, `created_at`, `updated_at`) are lower
  snake_case, consistent with the repo's stated conventions (no contradicting existing code). PASS.
- **Down reversibility:** `CREATE TABLE` paired with `DROP TABLE IF EXISTS`. PASS.
- **FK indexes:** no FKs in this slice (single-table, no references in or out). N/A — PASS.
- **Convention adherence:** PK override is explicit and cited (sad.md §8, ADR-0001), not silent;
  all undecided points were confirmed with the user rather than defaulted. PASS.

## Open items (`<!-- TBD -->`)

None — every column, constraint, and index in this slice has a confirmed source (repo convention,
sad.md decision, or explicit user confirmation).

## Next stage

`/sdd:api auth-user-plus-dashboard` — the `users` table (id, email) plus the sequence diagrams'
error branches (sad.md §6) are the contract inputs; no fast-lane skip applies since this is a
genuine schema addition (new table).
