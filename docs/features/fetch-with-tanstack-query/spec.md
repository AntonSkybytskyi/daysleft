---
status: Draft
owner: "Tech Lead"
reviewers: ["Tech Lead", "Security Lead"]
updated_at: "2026-09-03"
feature_size: "XS"
---

# Spec — fetch-with-tanstack-query

> **Glossary:** [CONTEXT](/CONTEXT.md) (repo-root; no feature-scoped glossary — no new domain terms)
> **Reference module / docs / channels used:** `src/modules/dashboard/ui/DashboardContainer.tsx`, `src/modules/dashboard/app/get-dashboard.ts`, `src/modules/auth/app/session.ts`, `docs/architecture-map.md`, `docs/features/auth-user-plus-dashboard/{sad.md,screens.md}`.

## 1. Context

Today the Traveler's days-left dashboard fetches its summary data with a hand-rolled `fetch` call inside a client-side effect: every mount issues a fresh network request with no shared cache, no request de-duplication, and loading/error handling coded ad hoc per screen. A Traveler switching tabs and back, or a component re-mounting, silently re-issues the same request; a transient network blip and a genuinely dead session currently look identical in the UI's error state until the code is read closely.

We're introducing a client-side data-fetching/caching layer now, while the dashboard's underlying data is still a hardcoded placeholder (no real trip data flows through it yet), specifically because this is the lowest-risk request in the app to prove the pattern on before other modules adopt it as their own fetching convention.

The committed approach: wrap the existing dashboard fetch in a client-side query/cache layer that de-duplicates repeat requests within a session, exposes explicit loading and error states, and — because the read response carries a one-time signal that automatic refetching would corrupt (see below) — is configured conservatively: no automatic silent background refetch, so its observable behavior on first load matches today's.

Investigation surfaced a constraint this spec must respect: the dashboard's read endpoint links the Traveler's identity to an existing account on qualifying reads, and the account-linking write itself is already safe to repeat (the server holds a durable mapping and short-circuits a repeat read). The real risk is narrower: the response's one-time "linked" indicator is only true on the first read after linking, and a caching layer's default automatic-refetch behavior (on window refocus, network reconnect, or retry) would consume that flag again and erase the one-time confirmation the Traveler already saw — not by repeating the write, but by re-fetching and re-evaluating a flag that is only meaningful once. This spec's goals and acceptance criteria are written so that one-time confirmation survives a routine revisit, not to make the underlying write more idempotent than it already is (§3 Non-goals).

## 2. Goals

- Eliminate duplicate network calls for the dashboard summary when the Traveler revisits the screen within the same sign-in session (tab-switch, re-mount) — one call is reused, not re-issued.
- Give the Traveler a consistent, explicit loading indicator and a recoverable error state on failure, replacing today's ad hoc per-case handling.
- Establish a reusable client data-fetching convention (cache scoping, logout cleanup) that later features can adopt for their own requests without re-solving the same problems.

## 3. Non-goals

- Migrating any request other than the dashboard summary fetch in this pass — reason: prove the pattern on the lowest-risk request before committing other modules to it.
- Converting the dashboard to server-side rendering — reason: it is already client-fetched today; there is no server-rendered data to preserve or hydrate.
- Making the dashboard's read endpoint free of side effects (the account-linking write) or replacing its one-time "linked" flag with persisted state — reason: that is an auth-module change with its own blast radius, tracked separately (§8).
- Persisting the client-side cache across browser restarts (e.g. to persisted browser storage) for offline use — reason: there is no delivered offline capability yet for this data path; persisting a cache would add cost without a delivered offline benefit.

## 4. User stories

### US-01: Avoid duplicate dashboard fetches

**As a** Traveler
**I want** revisiting the dashboard within the same sign-in session to reuse already-fetched data
**So that** I don't wait on a redundant network round-trip or trigger side effects twice

### US-02: See a clear loading state

**As a** Traveler
**I want** an explicit loading indicator while my dashboard summary is being fetched
**So that** I know the app is working and the screen isn't broken or empty

### US-03: Recover from a network error

**As a** Traveler
**I want** a clear, retry-capable message when my dashboard fails to load because of a network problem
**So that** I understand what went wrong and can try again without being told to sign in

### US-04: Be sent to sign in when my session has expired

**As a** Traveler
**I want** to be redirected to sign in when my session is no longer valid
**So that** I'm never shown a stale or empty dashboard mistaken for a network problem

### US-05: Never see another account's dashboard after logging out

**As a** Traveler
**I want** my dashboard data cleared from the app the moment I log out
**So that** the next person signing in on this device never sees my summary, even briefly

### US-06: Keep my one-time linked-account confirmation trustworthy

**As a** Traveler
**I want** the "signed in to your existing account" confirmation to appear exactly when it's true and not be silently retracted or re-triggered
**So that** I can trust what the dashboard tells me about my account without it flickering on a routine revisit

## 5. Acceptance criteria

### AC-01 (US-01) — happy path

**Given** a signed-in Traveler has already loaded their dashboard once during this sign-in session
**When** the Traveler revisits the dashboard screen (e.g. switches tabs and back, or the screen re-mounts) without signing out
**Then** the system shows the same summary instantly, without a visible loading flicker or a second network round-trip

### AC-06 (US-02) — happy path

**Given** a signed-in Traveler opens the dashboard for the first time in a session
**When** the summary has not yet finished loading
**Then** the system shows an explicit loading indicator instead of a blank or broken-looking screen

### AC-02 (US-03) — error

**Given** a signed-in Traveler opens the dashboard while their device has no network connectivity
**When** the fetch fails for a connectivity reason
**Then** the system shows a recoverable error message inviting the Traveler to try again, and does not send them to sign in

### AC-03 (US-04) — authorization

**Given** a Traveler's session has expired or is otherwise invalid
**When** the Traveler's dashboard summary is actually fetched (the initial load, or any later fetch the Traveler explicitly triggers, e.g. a retry) — not a revisit served from cache with no new fetch
**Then** the system sends the Traveler to sign in and reveals no dashboard data, distinguishing this outcome from a connectivity error

### AC-04 (US-06) — domain invariant

**Given** a Traveler was just linked to an existing account and has been shown the one-time confirmation
**When** the Traveler revisits the dashboard again in the same sign-in session
**Then** the system does not re-run the account-linking action and does not retract or re-show the confirmation as if it were a new event — the confirmation, once shown, is not silently erased by a routine revisit

### AC-05 (US-05) — cross-context

**Given** a Traveler logs out of the app, and the logout is honored by the server (their session is revoked there) regardless of whether the client-side sign-out step itself completes cleanly
**When** a different Traveler subsequently signs in on the same device
**Then** the new Traveler's dashboard never displays the previous Traveler's cached summary, even momentarily, because the prior session's cached data was cleared as soon as the server confirmed the logout — not conditioned on the client-side sign-out step succeeding

## 6. Non-functional requirements

| Aspect | Target | Measurement |
|---|---|---|
| Latency p95, dashboard first load | ≤ 500 ms | client RUM instrumentation (matches the existing dashboard first-render target) |
| Duplicate-fetch avoidance | 0 extra network calls per revisit for the lifetime of the sign-in session (until sign-out) | client fetch-count instrumentation / test assertion pinning call count |
| Throughput | N/A | <!-- N/A: client-side caching change, no new server load --> |
| Availability | N/A | <!-- N/A: no new server-side component; existing dashboard endpoint availability unchanged --> |
| One-time flag integrity | the one-shot "linked" confirmation, once shown, is not re-fetched-and-lost or re-fetched-and-re-shown for the rest of the sign-in session | integration test asserting the confirmation's visibility is unchanged across a repeat mount/focus with no new fetch |

## 6.1 Security / privacy

- **Data classification:** confidential — the cached response includes the Traveler's own email and summary, not shared with any other party.
- **Personal data touched:** none new; the existing dashboard response (including the Traveler's email) is now additionally held in a client-side cache for the duration of the session.
- **AuthZ/AuthN impact:** none new — the cache consumes the existing session check as-is. It adds one new requirement: the cache must be scoped to the current sign-in and discarded at logout, so a session boundary is also a cache boundary.
- **Abuse cases:**
  - **stale-authorization display:** because this pass deliberately disables automatic background revalidation (§1), cached summary data keeps rendering after a session was invalidated elsewhere until the Traveler triggers an actual fetch again — accepted as a risk bounded by "until the next real fetch", not eliminated; AC-03 guarantees that fetch (whenever it happens) always re-checks the session and never serves cached data as if it were still valid.
  - **data leak on shared device:** cached summary (including email) surviving past logout — hidden by AC-05 (cache cleared at logout).
  - **cross-tenant leakage:** N/A — the cache is client-side and per-device; it never mixes data across Travelers within a single browser process outside the logout boundary covered by AC-05.
- **Security review:** Required — client-side caching of personal data (the Traveler's email) is a new persistence surface even though the field itself isn't new.

## 7. Metrics / KPIs

- **Duplicate dashboard fetches per session** — baseline: 1 extra call per revisit (today's behavior), target: 0 for the lifetime of the sign-in session (until sign-out), measured within 30 days of rollout via client instrumentation.
- **Dashboard loading-state coverage** — baseline: 0% of loads show a differentiated loading indicator (today's code renders no distinct loading UI state), target: 100% of dashboard loads, verified by test coverage at launch.
- **Post-logout stale-data reports** — baseline: 0 (new metric, no prior cache existed to leak), target: remains 0, monitored ongoing via support-ticket tagging.

## 8. Open questions

- [ ] Should this feature also define a shared query-key convention/registry so a second module adopting the same pattern doesn't collide with the dashboard's cache key? Default now: no — the dashboard owns its own key informally, per module-ownership convention. — owner: Tech Lead, due: before the next feature adds a second cached query
- [ ] Should the endpoint persist the "linked" state (instead of a one-shot flag) so automatic background revalidation can be safely enabled later without losing the confirmation? Default now: no — automatic revalidation stays disabled for this pass (§1); the underlying account-linking write is already safe to repeat, only the one-shot flag isn't. — owner: Backend Lead, due: before any future feature proposes enabling auto-refetch
- [ ] Does adopting this client data-fetching pattern as an app-wide precedent warrant a dedicated ADR (cross-cutting, hard to reverse once other modules follow it)? Default now: yes — defer the decision to the design stage. — owner: Tech Lead, due: before `/sdd:design`
