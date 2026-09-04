---
status: Draft
owner: "Backend Lead"
reviewers: ["Tech Lead", "Security Lead"]
updated_at: "2026-09-02"
feature_size: "L"
---

# Data model — auth-user-plus-dashboard

## ER diagram

```mermaid
erDiagram
    users {
        text id PK
        text email
        timestamptz created_at
        timestamptz updated_at
    }
    linked_identities {
        text identity_id PK
        text canonical_user_id FK
        timestamptz created_at
    }
    users ||--o{ linked_identities : "canonical_user_id"
```

<!-- Two entities. Clerk is the system of record for sessions and magic-links (sad.md §4
ADR-0001) — no local session/magic-link table. Dashboard ships as an empty-state shell (spec §3
non-goal) — no dashboard-owned data yet. i18n is a static message catalog file
(src/lib/i18n/en.json), not a DB table (sad.md §5/§8). Future features (trips, rules) will FK to
users(id) — out of this slice's scope. -->

## Entities

### `users`

The local shadow of a Clerk account, kept in sync by the Clerk webhook (sad.md §4, §6 flows 1/3/4).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | TEXT | PK | The Clerk-issued user id itself — already globally unique, so no separate app-generated id (sad.md §8, explicit override of the repo's default UUIDv7-app-side convention for this table) |
| `email` | TEXT | NOT NULL, UNIQUE | The verified email Clerk returned (OAuth-verified or magic-link-confirmed); enforces account uniqueness (spec §5 AC-03, §7 duplicate-account-count monitor target 0) |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | Row creation (first sign-in, sad.md §6 flow 1/3/4 webhook upsert) |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | Bumped on every webhook sync (Clerk user-updated events) |

**Aggregate root:** `users` is its own root — the only entity in this slice (confirmed: single-aggregate scope, per sad.md §5 building blocks — no other persistence container is defined).
**Access patterns:**
- Webhook upsert by Clerk user id (sad.md §6 flows 1, 3, 4: "webhook — user created or matched by verified email") → served by the PK index on `id`.
- Duplicate-account monitor / account-uniqueness check (spec §7, §5 AC-03) → served by the UNIQUE index on `email`.
- §11 risk mitigation (synchronous create-or-fetch fallback if the webhook lags) → also served by the UNIQUE index on `email`.

**Constraints:** UNIQUE on `email`; no FKs (no other table references or is referenced by `users` in this slice).

<!-- created_at/updated_at, hard-delete, and TEXT for email were confirmed with the user — no repo
convention exists yet to detect from (greenfield, no code). PK type is NOT a fresh choice here: it
follows sad.md §8's explicit override, backed by ADR-0001. -->

### `linked_identities`

Maps a second Clerk identity that account-linking-by-email resolved onto the canonical `users`
row it resolved to (added in review round 3, T55 — replaces a process-local `Map` that didn't
survive across the horizontally-scaled instances sad.md §7 describes).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `identity_id` | TEXT | PK | The second Clerk identity's own user id — never gets its own `users` row since `users.email` is UNIQUE |
| `canonical_user_id` | TEXT | NOT NULL, FK → `users(id)` | The existing account this identity resolved to (spec §5 AC-03) |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | When the linking was first resolved |

**Access patterns:**
- `getSessionUser` looks up `identity_id = <Clerk id>` before re-hitting Clerk's API (sad.md §6
  flows 1/3/4's "linked" branch) → served by the PK.

**Constraints:** FK on `canonical_user_id` → `users(id)`; no cascade (a canonical user row is
never deleted in this slice).

## Indexes

| Index | Columns | Query it serves |
|---|---|---|
| `users_pkey` (implicit, PK) | `id` | Webhook upsert by Clerk user id (sad.md §6 flows 1/3/4); future FK joins from `trips`/`rules` |
| `users_email_key` (implicit, UNIQUE) | `email` | Account-linking match / duplicate-account monitor (spec §5 AC-03, §7); §11 create-or-fetch fallback lookup |
| `linked_identities_pkey` (implicit, PK) | `identity_id` | `getSessionUser`'s linked-identity lookup (AC-03), durable across instances |

<!-- No additional indexes: both access patterns are already served by the PK and the UNIQUE
constraint's automatic Postgres index — no "just in case" index added. -->

## Migration history note

The live `drizzle/0000_panoramic_paladin.*` migration replaced `drizzle/0000_lovely_venom.*` in
place at slot 0 (same `idx: 0` in `meta/_journal.json`). This is an intentional reset, not a slot
reuse of a real migration: `0000_lovely_venom` was `scaffold: materialize skeleton`'s smoke-test
placeholder (`CREATE TABLE _placeholder`), never applied to any environment beyond the scaffold's
own smoke check, and this feature is the project's first real schema. Replacing it kept the
migration history free of a meaningless placeholder table rather than appending a second `up`
migration whose only job would be dropping the first. Every migration from here forward is
additive — `pnpm db:up` / `pnpm db:down` (see `scripts/migrate-up.ts` / `scripts/migrate-down.ts`)
apply/revert in order, never rewrite an already-shipped slot.

## Test fixtures

- `newTestUser(overrides?)` — builds a `users` row with a deterministic UUID v7-shaped fake Clerk id (`user_test_<uuid>`) and `user-<uuid>@example.test` email; accepts overrides for account-linking / duplicate-email test scenarios (AC-03, AC-03b).
