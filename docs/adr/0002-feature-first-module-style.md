---
status: Accepted
date: 2026-09-02
---

# 0002 — Module style: feature-first

## Context

daysleft will grow multiple day-count rule types (Schengen, Vietnam, Thailand, more later)
plus offline sync, auth, and a dashboard. The codebase needs a layout that keeps each
capability's UI, logic, and data access together as rule types and features are added.

## Decision drivers

- New visa-rule types should be addable without touching unrelated code
- Avoid a "components/hooks/services" grab-bag that scatters one feature across many folders
- Keep the offline-sync boundary explicit and isolated

## Considered options

- **Feature-first modules** (`src/modules/<feature>/` owning UI + app logic + data access) — chosen
- Layered-by-technical-role (`components/`, `lib/`, `hooks/`, `api/`) — simpler at first, scatters
  as features grow, harder to reason about "everything related to Schengen rules"

## Outcome

Organize `src/modules/<name>/` by feature/domain (trips, rules, dashboard, auth, sync), each
owning its own UI, application logic, and data access. Shared cross-cutting code (DB schema,
UI primitives once established) lives in dedicated top-level folders (`src/db/`, `src/modules/ui/`).

## Consequences

- Good: a new rule type or feature is additive — new folder, minimal cross-module edits
- Good: the `sync` module's offline/online boundary stays isolated and auditable
- Bad: requires discipline to avoid modules reaching into each other's internals; enforce via
  imports only through each module's public surface (e.g. an `index.ts`)
