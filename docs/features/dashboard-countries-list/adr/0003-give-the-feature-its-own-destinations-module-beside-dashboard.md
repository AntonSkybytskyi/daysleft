---
status: Accepted
owner: "Tech Lead"
reviewers: ["Tech Lead"]
updated_at: "2026-09-06"
feature_size: "M"
ticket: "dashboard-countries-list"
---

# 0003 — Give the feature its own destinations module beside dashboard

- **Status:** Accepted
- **Date:** 2026-09-06
- **Deciders:** Tech Lead (during the `design` Socratic walk)

## Context

`CLAUDE.md` mandates feature-first modules under `src/modules/<name>/`, each owning its own UI, app logic and data access. `src/modules/dashboard/` today holds the header, the logout flow, the linked-account confirmation and a `"Nothing tracked yet."` placeholder body. The app shell feature — which §2 fixes as shipping before this one — takes the header, logout and confirmation out of it, and this feature replaces the placeholder body, so almost nothing of the module survives both changes. Where the tracked-destination code lands also decides what the trips and rules features import it as.

## Decision drivers

- `CLAUDE.md`: feature-first modules, no shared components/services/hooks grab-bag.
- The glossary's primitives are "tracked destination" and "destination catalogue"; "dashboard" names a screen, not a domain concept.
- SAD §2 (organisational, hard): the app shell ships first and is actively rewriting `src/modules/dashboard/`.
- SAD §2: the team is one developer, so the smallest reviewable diff is worth more than a tidier tree.

## Considered options

1. **A new `src/modules/destinations/` beside `dashboard`** — it owns the catalogue, app logic, query layer and screens; `dashboard` keeps the page composition and renders it.
2. **A new `destinations` module that retires `dashboard`** — it also absorbs `DASHBOARD_PATH`, the page and the existing `/api/v1/dashboard` endpoint, and `src/modules/dashboard/` is deleted.
3. **Extend `src/modules/dashboard/`** — tracked destinations become part of the existing module.

## Decision outcome

**Chosen:** Option 1. It gives the domain its own module under the name the glossary uses, which is what trips and rules will import, while touching none of the files the shell feature is concurrently rewriting. Option 2 produces the cleaner tree and remains the right eventual state, but sequencing two refactors of one folder is precisely the failure the spec already split the shell out to avoid. Option 3 was rejected because the module name would say nothing about what it holds.

## Consequences

**Positive**
- The domain module is named for the domain, so later features import `destinations`, not `dashboard`.
- No file contention with the app shell feature, which owns `src/modules/dashboard/` until it ships.
- The catalogue sits next to its only consumer.

**Negative**
- Two modules briefly cover one screen: `dashboard` composes the page, `destinations` fills it.
- `/api/v1/dashboard` remains, returning a `has_trips` flag nothing in this feature reads.

**Neutral**
- Retiring `dashboard` later is a mechanical move once the shell has settled; this ADR does not preclude it.

## Links

- Spec: [[../spec.md]] §1 (shell dependency), §3
- SAD: [[../sad.md]] §4, §5
- Related ADR: [[0002-address-an-open-tracked-destination-as-a-path-segment-under-dashboard]]
