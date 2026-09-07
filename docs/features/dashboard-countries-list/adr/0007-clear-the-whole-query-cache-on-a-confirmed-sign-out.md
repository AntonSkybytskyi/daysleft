---
status: Accepted
owner: "Tech Lead"
reviewers: ["Tech Lead", "Security Lead"]
updated_at: "2026-09-06"
feature_size: "M"
ticket: "dashboard-countries-list"
---

# 0007 — Clear the whole query cache on a confirmed sign-out

- **Status:** Accepted
- **Date:** 2026-09-06
- **Deciders:** Tech Lead (during the `design` Socratic walk)

## Context

Spec §5 AC-15 requires that after a confirmed sign-out, no tracked destination held for the previous Traveler is shown at any point to whoever signs in next on that device — "not even for an instant" before the new Traveler's own list is read. Spec §6.1 raises this as the shared-device leakage abuse case and notes deliberately that this feature discards what it remembered itself, rather than relying on a guarantee another feature made before these records existed. The shipped logout path already removes one named key: `clearDashboardQuery(queryClient, user.id)` in `src/modules/dashboard/ui/DashboardContainer.tsx:107`.

## Decision drivers

- Spec §5 AC-15: nothing of the previous Traveler is shown, not even momentarily.
- Spec §6.1, shared-device leakage: the guarantee must be made by this feature, not inherited.
- SAD §1 quality goal 1: confidentiality of a Traveler's tracked set.
- SAD §2: `QueryClient` is built per render in `src/app/providers.tsx`, and every cached resource in this app is per-Traveler.

## Considered options

1. **`queryClient.clear()` on a confirmed sign-out** — drop the entire cache rather than named keys.
2. **Extend the named-key pattern** — add `clearDestinationsQuery` beside `clearDashboardQuery`.
3. **Rely on the per-render `QueryClient`** — a fresh client per render plus `staleTime: Infinity` means nothing survives a reload.

## Decision outcome

**Chosen:** Option 1. It makes AC-15 a property of signing out rather than an obligation each resource must remember to register for; trips, rules and every later feature inherit it without doing anything, and there is no silent failure mode where a new key was simply never added to a list. Option 3 was rejected because it holds only if sign-out forces a full document load — a client-side navigation to `/login` keeps the same `QueryClient` alive, which would rest a security guarantee on routing behaviour this feature does not control.

## Consequences

**Positive**
- No future feature can leak a previous Traveler's data by forgetting to register a key.
- The guarantee is one call at one place, which is what a security review can actually check.
- Correct whether sign-out is a client-side navigation or a full load.

**Negative**
- Discards cached data unrelated to identity as well. Harmless today because every cached resource in this app is per-Traveler, but it would need revisiting if a genuinely shared, expensive-to-fetch cache ever appears.
- Slightly diverges from the shipped named-key precedent, so `clearDashboardQuery` becomes redundant and should be retired rather than left as a second, weaker pattern.

**Neutral**
- The clear happens only on a *confirmed* sign-out, matching AC-15's wording; a sign-out that fails leaves the cache intact, which is what the existing retry flow expects.

## Links

- Spec: [[../spec.md]] §5 AC-15, §6.1 (shared-device leakage)
- SAD: [[../sad.md]] §8, §10 QG-1
- Related ADR: [[0001-serve-tracked-destinations-over-an-http-api-consumed-by-tanstack-query]]
