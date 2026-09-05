---
status: Accepted
owner: "Tech Lead"
reviewers: ["Tech Lead"]
updated_at: "2026-09-06"
feature_size: "M"
ticket: "dashboard-countries-list"
---

# 0001 — Serve tracked destinations over an HTTP API consumed by TanStack Query

- **Status:** Accepted
- **Date:** 2026-09-06
- **Deciders:** Tech Lead (during the `design` Socratic walk)

## Context

The dashboard body is a placeholder and this feature introduces the first real per-Traveler resource. The repository holds two contradictory precedents for reaching server data: `docs/architecture-map.md` planned React Server Components plus server actions, while the code that actually shipped exposes `GET /api/v1/dashboard` and consumes it through a TanStack Query hook built by a deliberate `fetch-with-tanstack-query` feature. This feature sets the precedent that the trips and rules features behind it will follow, and it determines whether a `backend-service` surface exists at all — a server action runs inside the web container, an HTTP endpoint is a container beside it.

## Decision drivers

- Spec §5 AC-11 requires one recoverable error presentation for every non-session failure, with a retry the Traveler drives and nothing retrying on its own — already how the shipped query layer behaves (`retry: false`).
- Spec §5 AC-14 requires a confirmed invalid sign-in to take precedence over that error, which the shipped query layer already expresses through a typed error thrown on 401.
- Spec §5 AC-03 requires the tracked set to be identical on any device the Traveler signs in on, so the list must be server-held regardless of transport.
- SAD §2 Conventions: app-layer functions return a typed `{ status, body }` result that a route serializes, with the unified `{ error: { code, message } }` envelope from `src/lib/errors.ts`.
- Spec §8 defers offline creation and reading to a future sync feature, which will need a server interface to reconcile against.

## Considered options

1. **HTTP API routes plus TanStack Query** — `GET`/`POST /api/v1/destinations` and `DELETE /api/v1/destinations/[id]`, consumed by `useQuery` and `useMutation`.
2. **Server Components plus server actions** — the list is read during server rendering and mutated by server actions; no HTTP endpoint exists.
3. **Hybrid** — first paint from a Server Component, writes through HTTP endpoints.

## Decision outcome

**Chosen:** Option 1. It matches both shipped features rather than contradicting them, and the two acceptance criteria with the most delicate behaviour — AC-11's single recoverable error and AC-14's precedence rule — are already implemented in the query layer this reuses. It gives the `api` stage a contract to lock and leaves the deferred sync feature an interface to reuse. Option 3 was rejected because AC-01 and AC-08 both hinge on the list reflecting only confirmed writes, and reconciling a server-rendered list against a mutation response is exactly where that guarantee breaks.

## Consequences

**Positive**
- Reuses the shipped error, session-invalid and cache-clearing paths instead of inventing parallel ones.
- Produces an OpenAPI contract at the `api` stage, so the interface is reviewable before implementation.
- Leaves a server interface the deferred offline-sync feature can reconcile against.

**Negative**
- More layers than server actions need for what is, at this stage, list CRUD: a route, an app-layer function, a query module and a container.
- The list is fetched client-side, so first paint shows a loading state rather than data.

**Neutral**
- `docs/architecture-map.md` still describes the server-actions plan; the map is stale in several respects already and is due a `survey` re-run.

## Links

- Spec: [[../spec.md]] §5 AC-03, AC-11, AC-14
- SAD: [[../sad.md]] §4, §5
- Related ADR: [[0005-confirm-writes-server-side-then-splice-the-confirmed-record-into-the-cache]]
