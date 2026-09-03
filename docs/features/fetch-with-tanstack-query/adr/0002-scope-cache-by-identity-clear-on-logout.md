---
status: Accepted
owner: "Tech Lead"
reviewers: ["Backend Lead", "Security Lead"]
updated_at: "2026-09-03"
feature_size: "XS"
ticket: "fetch-with-tanstack-query"
---

# 0002 — Scope the dashboard's client cache by Traveler identity and clear it on logout

- **Status:** Accepted
- **Date:** 2026-09-03
- **Deciders:** Tech Lead + user (design Socratic walk)

## Context

The cached dashboard response includes the Traveler's own email (spec §6.1: confidential data classification). ADR-0001 keeps that response in a client-side cache for the lifetime of the page load with no automatic eviction. Without an explicit policy, the cache could survive past logout, or — the sharper risk — a different Traveler signing in on the same device afterward could read the prior Traveler's cached entry if clearing and the new sign-in race (spec AC-05's "even momentarily" requirement).

## Decision drivers

- Data leak on a shared device is an explicit abuse case the spec requires closed (spec §6.1)
- AC-05 (spec §5): a new Traveler's dashboard must never display a previous Traveler's cached summary, even momentarily
- No new persisted state or backend change is in scope for this pass (spec §3 non-goals)

## Considered options

1. **Clear-on-response only** — clear the cache as soon as the logout request's response confirms the server revoked the session; no other change to how the cache is keyed.
2. **Clear-on-response + identity-scoped cache key** — same clearing trigger, plus the cache key includes the signed-in Traveler's id, so even if clearing and a new sign-in raced, the new Traveler's fetch would use a different key and could never read the old entry.
3. **Persist cache to storage keyed by identity** — go further and persist the identity-scoped cache across page reloads.

## Decision outcome

**Chosen:** Option 2. Clearing alone (Option 1) satisfies the common case but leaves a theoretical race between the clear and a fast subsequent sign-in on the same device; keying by identity closes that gap at effectively no extra cost (the identity is already known wherever the cache is read or written). Option 3 was rejected as out of scope — persisting the cache across reloads is an explicit spec non-goal (spec §3) and would need its own review of what surviving a browser restart implies for cached PII.

## Consequences

**Positive**
- AC-05's "even momentarily" guarantee holds even under a clear/sign-in race, not just in the common sequential case.
- No backend change required — the identity used to key the cache is already available client-side wherever the query is read.

**Negative**
- Slightly more configuration than a bare clear-on-logout (the query key must thread the Traveler's identity through), though within the same PR's scope.

**Neutral**
- If a second module later caches Traveler-specific data, it should follow the same identity-scoping convention — not yet formalized as a shared registry (spec §8 OQ1, tracked as an open question in sad.md §11).

## Links

- Spec: [[../spec.md]] §5 AC-05, §6.1, §8 OQ1
- SAD: [[../sad.md]] §4, §8
- Related ADR: [[0001-adopt-tanstack-query-conservative-refetch]] — the library choice and refetch policy for the same cache
