---
status: Accepted
owner: "Tech Lead"
reviewers: ["Backend Lead", "Frontend Lead"]
updated_at: "2026-09-03"
feature_size: "XS"
ticket: "fetch-with-tanstack-query"
---

# 0001 — Adopt TanStack Query with a conservative refetch policy

- **Status:** Accepted
- **Date:** 2026-09-03
- **Deciders:** Tech Lead + user (design Socratic walk)

## Context

The dashboard's days-left summary is fetched with a hand-rolled `fetch` in a client-side effect: no shared cache, no de-duplication, ad hoc loading/error handling (sad.md §1). This is also intended as the pattern other modules copy later (spec Goal 3), so the choice of library and its configuration outlive this one PR. The read being cached is not a plain idempotent GET: it performs an account-linking check server-side and its response carries a one-time "linked" confirmation that is only true on the first read after linking (sad.md §3, spec §1). A library's default automatic-refetch behavior (window-focus, reconnect, retry) would re-fetch and re-evaluate that flag, erasing a confirmation the Traveler already saw.

## Decision drivers

- Eliminate duplicate network calls per revisit (spec Goal 1; spec §6 "Duplicate-fetch avoidance")
- Give a consistent, explicit loading and recoverable-error state (spec Goal 2; spec §5 AC-02/AC-06)
- Preserve the one-time linked-confirmation guarantee (spec §5 AC-04; spec §6 "One-time flag integrity")
- Establish a convention other modules can copy later, without over-building a shared abstraction now (spec Goal 3; spec §3 non-goals)

## Considered options

1. **TanStack Query** — a dedicated client-side query/cache library with per-query configuration (staleTime, gcTime, refetch triggers, retry) granular enough to disable every automatic-refetch trigger individually.
2. **SWR** — a comparable client-side fetch/cache library with a similar configuration surface (`revalidateOnFocus`, `revalidateOnReconnect`, `shouldRetryOnError`).
3. **Hand-rolled cache** — keep the existing `useEffect`+`fetch` pattern, adding a small in-module cache/dedup mechanism by hand.

Converting the dashboard to server-side rendering instead of adding a client cache was not a real fourth option here: spec §3 already excludes it as a non-goal (the dashboard's data is still a hardcoded placeholder, and this pass deliberately proves the pattern on the lowest-risk request first — spec §1), so it was never weighed against the three above.

## Decision outcome

**Chosen:** Option 1, TanStack Query, configured with `staleTime`/`gcTime` unbounded for the page's lifetime, `refetchOnWindowFocus: false`, `refetchOnReconnect: false`, and `retry: false` (one explicit, user-triggered retry control instead — spec §5 AC-02). Chosen over SWR because it was named as the intended library in the originating feature idea and offers the same fine-grained control needed here; over the hand-rolled cache because de-duplication/cache-lifecycle bugs are exactly the class of bug a mature library already solved.

## Consequences

**Positive**
- Duplicate-fetch avoidance and explicit loading/error states are solved by configuration, not new hand-written logic.
- The one-time `linked` flag's fragility is neutralized without touching the endpoint — no automatic trigger can silently consume it (spec §5 AC-04).
- A documented, reusable convention exists for the next module that needs client-side caching (spec Goal 3).

**Negative**
- Adds a new runtime dependency (`@tanstack/react-query`) to an app with no prior client-fetching library — a small bundle-size cost.
- Disabling every automatic-refetch trigger forgoes TanStack Query's main selling point (background freshness) for this query — the dashboard can show stale-after-invalidation data until the Traveler triggers a real fetch (spec §6.1 "stale-authorization display", accepted risk).

**Neutral**
- Switching to SWR later is possible (similar API shape) but not free — every call site and test would need updating; low but non-zero migration cost.
- Enabling automatic revalidation later requires the backend to persist `linked` state instead of a one-shot flag (spec §8 OQ2) — tracked as an open question, not solved here.

## Links

- Spec: [[../spec.md]] §1, §5 AC-01/AC-02/AC-04/AC-06, §8 OQ2/OQ3
- SAD: [[../sad.md]] §4
- Related ADR: [[0002-scope-cache-by-identity-clear-on-logout]] — the identity-scoping/logout-clear policy for the same cache
