---
status: Draft
owner: "Tech Lead"
reviewers: ["Tech Lead", "Security Lead"]
updated_at: "2026-09-03"
feature_size: "XS"
---

# Spec — fetch-with-tanstack-query

> **Glossary:** [CONTEXT](/CONTEXT.md) (repo-root; adds "Sign-in session" during clarify)
> **Reference module / docs / channels used:** `src/modules/dashboard/ui/DashboardContainer.tsx`, `src/modules/dashboard/app/get-dashboard.ts`, `src/modules/auth/app/session.ts`, `docs/architecture-map.md`, `docs/features/auth-user-plus-dashboard/{sad.md,screens.md}`.

## 1. Context

Today the Traveler's days-left dashboard fetches its summary data with a hand-rolled `fetch` call inside a client-side effect: every mount issues a fresh network request with no shared cache, no request de-duplication, and loading/error handling coded ad hoc per screen. A Traveler switching tabs and back, or a component re-mounting, silently re-issues the same request; a transient network blip and a genuinely dead session currently look identical in the UI's error state until the code is read closely.

We're introducing a client-side data-fetching/caching layer now, while the dashboard's underlying data is still a hardcoded placeholder (no real trip data flows through it yet), specifically because this is the lowest-risk request in the app to prove the pattern on before other modules adopt it as their own fetching convention.

The committed approach: wrap the existing dashboard fetch in a client-side query/cache layer that de-duplicates repeat requests within a session, exposes explicit loading and error states, and — because the read response carries a one-time signal that automatic refetching would corrupt (see below) — is configured conservatively: no automatic silent background refetch, so its observable behavior on first load matches today's.

Investigation surfaced a constraint this spec must respect: the dashboard's read endpoint links the Traveler's identity to an existing account on qualifying reads, and the account-linking write itself is already safe to repeat (the server holds a durable mapping and short-circuits a repeat read). The real risk is narrower: the response's one-time "linked" indicator is only true on the first read after linking, and a caching layer's default automatic-refetch behavior (on window refocus, network reconnect, or retry) would consume that flag again and erase the one-time confirmation the Traveler already saw — not by repeating the write, but by re-fetching and re-evaluating a flag that is only meaningful once. This spec's goals and acceptance criteria are written so that one-time confirmation survives a routine revisit, not to make the underlying write more idempotent than it already is (§3 Non-goals).

Two scoping notes that every duration/count guarantee below is measured against: (1) "sign-in session" (see [CONTEXT](/CONTEXT.md)) is bounded by the current page load for this cache — a browser reload is a fresh sign-in session for client-side state, even though the Traveler's underlying authentication may still be valid; the cache is never persisted across reloads (§3 Non-goals). (2) No automatic retry runs on a failed fetch — a failure goes straight to the recoverable error state (§5 AC-02) with one explicit, user-triggered retry control; nothing retries silently in the background.

## 2. Goals

- Eliminate duplicate network calls for the dashboard summary when the Traveler revisits the screen within the same sign-in session (tab-switch, re-mount) — one call is reused, not re-issued.
- Give the Traveler a consistent, explicit loading indicator and a recoverable error state on failure, replacing today's ad hoc per-case handling.
- Establish a reusable client data-fetching convention other requests can copy: the query-client provider this feature adds (necessarily placed where it can wrap the app) plus a short written note on the pattern (cache scoping, logout cleanup) — not a shared hook factory or generic abstraction, which stays out of scope for this pass (§3).

## 3. Non-goals

- Migrating any request other than the dashboard summary fetch in this pass — reason: prove the pattern on the lowest-risk request before committing other modules to it.
- Converting the dashboard to server-side rendering — reason: it is already client-fetched today; there is no server-rendered data to preserve or hydrate.
- Making the dashboard's read endpoint free of side effects (the account-linking write) or replacing its one-time "linked" flag with persisted state — reason: that is an auth-module change with its own blast radius, tracked separately (§8).
- Persisting the client-side cache across browser restarts (e.g. to persisted browser storage) for offline use — reason: there is no delivered offline capability yet for this data path; persisting a cache would add cost without a delivered offline benefit.
- Building a shared hook factory or a generic multi-module data-fetching abstraction — reason: this pass wires one query and documents the pattern in prose (§2); a shared abstraction is only worth building once a second module actually adopts it (§8).
- Building production telemetry (RUM timing dashboards, a fetch-count metric pipeline, support-ticket auto-tagging) — reason: this pass's NFR/KPI measurements are satisfied by test assertions in CI, not new production instrumentation; wiring real telemetry is a separate, later effort.

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

**Given** a signed-in Traveler has already loaded their dashboard once during this sign-in session (this page load; a browser reload starts a new one)
**When** the Traveler revisits the dashboard screen (e.g. switches tabs and back, or the screen re-mounts) without signing out or reloading the page
**Then** the system renders the already-fetched summary on first paint with no loading state shown, and issues no second network round-trip

### AC-06 (US-02) — happy path

**Given** a signed-in Traveler opens the dashboard for the first time in a page load, or has triggered the AC-02 retry control after a failure
**When** that fetch has not yet finished
**Then** the system shows an explicit loading indicator instead of a blank or broken-looking screen

### AC-02 (US-03) — error

**Given** a signed-in Traveler's dashboard summary fetch fails for any reason other than a confirmed invalid-session signal (no connectivity, a server-side failure, a timeout, an unreadable response)
**When** the fetch fails
**Then** the system shows a recoverable error message with one explicit retry control the Traveler can trigger themselves — no automatic retry — and does not send them to sign in; the fetch is never retried on its own before this state is shown

### AC-03 (US-04) — authorization

**Given** a Traveler's session has expired or is otherwise invalid
**When** the Traveler's dashboard summary is actually fetched (the initial load, or any later fetch the Traveler explicitly triggers, e.g. a retry) and that fetch's response carries the confirmed invalid-session signal — not a revisit served from cache with no new fetch, and not any other failure (which falls to AC-02 instead)
**Then** the same client-side fetching logic that owns the dashboard's data request sends the Traveler to sign in and reveals no dashboard data, distinguishing this outcome from AC-02's connectivity/server-error case

### AC-04 (US-06) — domain invariant

**Given** a Traveler was just linked to an existing account and has been shown the one-time confirmation
**When** the Traveler revisits the dashboard again in the same sign-in session, including a later fetch (e.g. an AC-02 retry) whose response no longer carries the linked indicator
**Then** the confirmation remains visible for the rest of the sign-in session once shown — the system never lets a later fetch's response retract or hide it, and never re-runs the account-linking action or re-shows it as if it were a new event

### AC-05 (US-05) — cross-context

**Given** a Traveler logs out of the app, and the logout request's response confirms the server revoked their session — regardless of whether the client-side sign-out step itself completes cleanly
**When** a different Traveler subsequently signs in on the same device
**Then** the new Traveler's dashboard never displays the previous Traveler's cached summary, even momentarily: the cache is cleared the moment that server response arrives (not conditioned on the client-side sign-out step succeeding), and is additionally scoped to the signed-in Traveler's identity so a new Traveler's dashboard can never read an entry left behind by a prior one

## 6. Non-functional requirements

| Aspect | Target | Measurement |
|---|---|---|
| Latency p95, dashboard first load | ≤ 500 ms | test assertion in CI this pass (matches the existing dashboard first-render target; production RUM instrumentation is out of scope, §3) |
| Duplicate-fetch avoidance | 0 extra network calls per revisit within the same page load, for as long as the Traveler stays signed in (a reload starts fresh, §1) | test assertion in CI pinning fetch call count across a repeat mount/focus |
| Cache retention | the cached entry is never evicted or treated as stale before sign-out or page unload — no time-based expiry | test assertion in CI (staleTime/gcTime configuration + a repeat-access test) |
| Throughput | N/A | <!-- N/A: client-side caching change, no new server load --> |
| Availability | N/A | <!-- N/A: no new server-side component; existing dashboard endpoint availability unchanged --> |
| One-time flag integrity | once the "linked" confirmation is shown, it remains visible for the rest of the sign-in session even if a later fetch's response no longer carries the flag (AC-04) | test assertion in CI: confirmation stays visible across a repeat mount/focus and across an AC-02 retry whose response omits the flag |

## 6.1 Security / privacy

- **Data classification:** confidential — the cached response includes the Traveler's own email and summary, not shared with any other party.
- **Personal data touched:** none new; the existing dashboard response (including the Traveler's email) is now additionally held in a client-side cache for the duration of the session.
- **AuthZ/AuthN impact:** none new — the cache consumes the existing session check as-is. It adds one new requirement: the cache must be scoped to the current sign-in and discarded at logout, so a session boundary is also a cache boundary.
- **Abuse cases:**
  - **stale-authorization display:** because this pass deliberately disables automatic background revalidation (§1), cached summary data keeps rendering after a session was invalidated elsewhere until the Traveler triggers an actual fetch again — accepted as a risk bounded by "until the next real fetch", not eliminated; AC-03 guarantees that fetch (whenever it happens) always re-checks the session and never serves cached data as if it were still valid.
  - **data leak on shared device:** cached summary (including email) surviving past logout, or a new Traveler reading a prior one's entry — hidden by AC-05 (cache cleared on the server-confirmed logout response, and scoped by Traveler identity so a new sign-in can't read an old entry regardless of clearing timing).
  - **cross-tenant leakage:** N/A — the cache is client-side, per-device, and per-Traveler-identity (AC-05); it never mixes data across Travelers within a single browser process.
- **Security review:** Required — client-side caching of personal data (the Traveler's email) is a new persistence surface even though the field itself isn't new.

## 7. Metrics / KPIs

- **Duplicate dashboard fetches per page load** — baseline: 1 extra call per revisit (today's behavior), target: 0 within the same page load for as long as the Traveler stays signed in, verified by test assertion at launch (production instrumentation is out of scope, §3).
- **Dashboard loading-state coverage on fetching loads** — baseline: 0% of loads that actually fetch show a differentiated loading indicator (today's code renders no distinct loading UI state); target: 100% of loads that perform a real fetch (a cache-served revisit is exempt — AC-01 forbids showing a loading state there), verified by test coverage at launch.
- **Post-logout stale-data reports** — baseline: 0 (new metric, no prior cache existed to leak), target: remains 0; monitored via manual triage of support tickets (automated ticket tagging is out of scope, §3).

## Test plan

One-line frame: this feature must make the dashboard's data fetch de-duplicated, explicitly loading/error-stated, and safe against a read that performs a write and returns a one-shot flag — without leaking cached data across a logout/sign-in identity boundary.

**Levels used:** component (a UI surface is declared in `sad.md` `target_surfaces`), unit, integration. No contract/e2e-through-UI/visual-regression/load rows this pass (see notes below).

### AC coverage

| AC (spec §5) | Test name (intent-based) | Level | Expected outcome |
|---|---|---|---|
| AC-01 (happy) | cache-hit revisit renders instantly with no duplicate fetch | component | same summary shown immediately, exactly one fetch call total across both renders |
| AC-02 (error) | non-session failure shows a recoverable error with a single manual retry | component | error state with one retry control renders; no automatic retry fires; triggering it issues exactly one more fetch |
| AC-03 (authorization) | confirmed invalid session redirects to sign-in, distinct from a connectivity failure | component | redirected to sign-in with no dashboard data shown; a paired case proves a plain connectivity failure does NOT redirect (goes to AC-02's error state instead) |
| AC-04 (domain invariant) | linked confirmation survives a retry whose response omits the flag | component | confirmation stays visible after the retry, not re-triggered and not hidden |
| AC-05 (cross-context) | identity-scoped cache key and clear-helper behave correctly | unit | the key function returns a different key per Traveler identity; the clear helper removes exactly the calling Traveler's entry |
| AC-05 (cross-context) | logout clears the cache; a different Traveler's fetch never reads the old entry | integration | the entry is gone immediately after the logout response confirms server-side revocation; a subsequently-signed-in different Traveler's fetch reads only its own data |
| AC-06 (happy) | loading indicator shows on first load and on retry | component | the loading indicator renders before each fetch resolves, both on first mount and after triggering the AC-02 retry |

### Edge cases / error paths

- Unreadable/malformed response body → expected: falls into AC-02's recoverable-error path, not a crash or a silent blank screen.
- Backend dependency unavailable / request times out → expected: same AC-02 recoverable-error path (no distinct behavior from a plain connectivity failure).
- Session already expired on the very first load (not just a later fetch) → expected: AC-03's redirect fires on the first attempt too, not only on a retry.
- Client-side sign-out step fails after the server already confirmed the logout → expected: the cache is still cleared (AC-05 holds) even though the UI shows the existing `error-logout-failed` state.
- Retry control triggered while a retry is already in flight → expected: the control is disabled during the in-flight request (its own `loading` prop), so no second concurrent fetch is issued.

### Test data

- Seed strategy: no new entities (`data-model.md` legally absent — no schema change); test fixtures are plain response objects shaped like the existing `/api/v1/dashboard` payload (`linked`, summary fields), varied per scenario.
- Integration dependency: the real (in-memory, ephemeral per test) TanStack Query cache instance — not a mocked cache. No datastore is involved (no backend change).
- Cleanup boundary: per-test — each test constructs its own `QueryClient` instance and discards it, so no state leaks between tests.

### NFR validation (load)

<!-- N/A: the one numeric NFR (dashboard first-load latency ≤ 500 ms, spec §6) is client-side render timing verified by a component-level test assertion, not a throughput/load scenario — there is no server-side change and no request-rate target to load-test. -->

### CI placement

- On every PR: all component and unit tests (fast).
- Integration (the cache/logout test) also runs on every PR — it's in-memory and fast, no throwaway external dependency needed.

## 8. Open questions

- [ ] Should this feature also define a shared query-key convention/registry so a second module adopting the same pattern doesn't collide with the dashboard's cache key? Default now: no — the dashboard owns its own key informally, per module-ownership convention. — owner: Tech Lead, due: before the next feature adds a second cached query
- [ ] Should the endpoint persist the "linked" state (instead of a one-shot flag) so automatic background revalidation can be safely enabled later without losing the confirmation? Default now: no — automatic revalidation stays disabled for this pass (§1); the underlying account-linking write is already safe to repeat, only the one-shot flag isn't. — owner: Backend Lead, due: before any future feature proposes enabling auto-refetch
- [x] Does adopting this client data-fetching pattern as an app-wide precedent warrant a dedicated ADR (cross-cutting, hard to reverse once other modules follow it)? Resolved → yes, see [ADR-0001](./adr/0001-adopt-tanstack-query-conservative-refetch.md). — owner: Tech Lead, due: before `/sdd:design`
- [ ] Should AC-04's linked confirmation be scoped to the sign-in session (identity/session-keyed) rather than to the container's mount? Deferred from review 2026-09-04 (F4): the invariant holds today only because refetching is fully disabled, and the guarding test drives `refetchQueries` directly rather than a reachable path. — owner: Tech Lead, due: before any change relaxes `staleTime`/`gcTime` or adds a refetch trigger
- [ ] Should `DashboardScreen`'s own suite assert the `error` state's retry control (renders, calls `onRetry`, shows the in-flight spinner), and should the test plan's AC-06 "loading indicator after the retry" row get its missing spinner assertion? Deferred from review 2026-09-04 (F5): T7 was closed as "coverage already satisfied", but the screen-level assertions screens.md SCR-01 declares are absent. — owner: Tech Lead, due: before `/sdd:ship`
