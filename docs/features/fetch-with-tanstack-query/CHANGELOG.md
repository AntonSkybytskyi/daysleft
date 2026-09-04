# Changelog — fetch-with-tanstack-query

## fetch-with-tanstack-query — client-side cache/dedup layer for the dashboard fetch

**What:** The dashboard summary fetch now goes through TanStack Query instead of a hand-rolled
`useEffect` + `fetch`. Revisiting the dashboard within the same page load (tab-switch, re-mount)
reuses the already-fetched data — no second network round-trip, no re-triggered account-linking
read. An explicit loading spinner shows on any real fetch (first load or retry); a failed fetch
shows a recoverable error with a single manual retry control (no silent auto-retry). A confirmed
invalid session — whether surfaced by a fetch response or by Clerk's own `user` going null while
the dashboard stays mounted — redirects to sign-in via `resolveReturnTo`, distinct from a plain
connectivity/server error. The one-time "linked to your existing account" confirmation, once
shown, survives any later fetch in the same session even if that fetch's response omits the flag.
The cache is identity-scoped and cleared the moment a server-confirmed logout response arrives, so
a different Traveler signing in on the same device can never read a stale entry.

**Why:** Today's ad hoc fetch re-issues on every mount and conflates "session dead" with "network
blip" in the UI. This pass proves the query/cache pattern on the lowest-risk request (dashboard
data is still placeholder) before other modules adopt it. See [spec](../spec.md) §1/§2. Key
decisions: [ADR-0001](./adr/0001-adopt-tanstack-query-conservative-refetch.md) (adopt TanStack
Query with all automatic background refetch disabled, since the read response carries a one-shot
"linked" flag that a default refetch would silently consume) and
[ADR-0002](./adr/0002-scope-cache-by-identity-clear-on-logout.md) (cache key scoped to Traveler
identity, cleared on server-confirmed logout — not on the client-side sign-out step, which can
fail independently).

**How to use:** No new endpoint — `GET /api/v1/dashboard` is unchanged. `Providers` (`src/app/providers.tsx`)
now wraps the app in a `QueryClientProvider` with a per-render `QueryClient`
(`refetchOnWindowFocus`/`refetchOnReconnect`/`retry` all off, `staleTime`/`gcTime` set to never
expire within the session). `DashboardContainer` consumes the dashboard query hook
(`src/modules/dashboard/app/dashboard-query.ts`) instead of its own fetch effect.

**Operational notes:**
- Migration: none — no schema change (§3 non-goals).
- Feature flag / config: none new.
- Rollback: revert the deploy; no migration to unwind.

**Acceptance criteria delivered:** AC-01, AC-02, AC-03 (both the fetch-driven and the no-fetch
Clerk-`user`-goes-null branches, per the widened `When` clause from the F1 review fix), AC-04,
AC-05, AC-06.

**Deferred (spec.md §8, tracked for future passes):**
- A shared query-key convention/registry — deferred until a second module adopts the pattern.
- Persisting the endpoint's "linked" state so automatic background revalidation can be safely
  enabled later — deferred to the auth module (Backend Lead).
- AC-04's linked-confirmation scoping to sign-in-session/identity rather than container mount —
  the invariant holds today only because refetch is fully disabled; revisit before any change
  relaxes `staleTime`/`gcTime` or adds a refetch trigger (Tech Lead).
