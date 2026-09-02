---
status: Draft
owner: "a.skybytskyi@gmail.com"
reviewers: ["Tech Lead", "Security Lead"]
updated_at: "2026-09-02"
feature_size: "L"
---

# Spec — auth-user-plus-dashboard

> **Glossary:** [CONTEXT](../../../CONTEXT.md)
> **Reference module / docs / channels used:** None — only the interview + CONTEXT.

## 1. Context

daysleft is a greenfield visa/travel day-count tracker with no code shipped yet. Before any day-count feature (trips, Schengen/Vietnam/Thailand rules) can exist, a Traveler needs a way to create an account and reach a protected home screen — this is the first user-facing vertical slice of the app.

Why now: `survey` has already fixed the module boundaries (`auth`, `dashboard` in `docs/architecture-map.md`), but nothing is wired end-to-end yet; the auth-solution pick itself is reopened (see §8). This feature proves the auth + dashboard shell works before any trip or rule data lands on top of it, unblocking every subsequent feature that assumes a signed-in Traveler.

Committed approach: passwordless authentication only — OAuth (Google, GitHub) plus magic-link email, no password at all — with email-based account linking so the same person never ends up with two accounts regardless of which method they used. The dashboard route is session-gated (unauthenticated visitors are redirected to login and returned to the page they requested afterward), logout (in the page header) fully ends the session on that browser, and the dashboard itself ships as an empty-state shell that later features populate. i18n plumbing ships now at minimal scope — a message catalog + translate helper with English strings extracted into it — with only English content populated; locale-aware date/number/currency formatting and locale-prefixed routing are not part of this slice.

Decisions carried from the ideation pass: account-linking by verified email (closes the "same email via two providers creates two accounts" failure mode); logout ends the session server-side on the current browser, not just a client cookie clear (closes the "still logged in after logout" failure mode; a global all-devices logout is explicitly not this slice's scope); the post-login return-to destination is validated against the app's own origin (closes the open-redirect failure mode); i18n plumbing ships now at minimal scope specifically because string extraction is cheap today and expensive to retrofit once real locale-dependent content (dates, currency, day-counts) exists — deeper locale-aware formatting is deferred until a second locale is actually scheduled.

## 2. Goals

- Give Travelers a frictionless, password-free way to create an account and reach their dashboard.
- Establish the session-gated foundation every future feature (trips, rules, dashboard content) builds on.
- Ship a minimal i18n foundation now (message catalog + string extraction) so future localization is additive, not a rewrite.

## 3. Non-goals

- Password-based login — not supported in this slice; OAuth + magic-link removes the password-reset/credential-storage security surface entirely.
- Multi-role support (staff/admin roles, family/group accounts) — out of scope now; the single Traveler role covers this slice, and the account model is not being pre-built for roles that don't exist yet.
- Populated dashboard content (day-count summaries, visa-run alerts) — out of scope; this slice ships the shell only, content depends on the not-yet-built trips/rules modules.
- Additional locales beyond English — out of scope; the i18n plumbing ships now but translated content is future work.
- Locale-aware date/number/currency formatting and locale-prefixed routing/negotiation — out of scope for this slice; the i18n foundation is a message catalog + string extraction only, formatting depth is added when a second locale is actually scheduled.
- Cross-device logout / revoking sessions on other devices — out of scope; logout in this slice ends the session only on the browser that performed it.
- Offline behavior of the auth/dashboard shell — out of scope; establishing a session inherently needs network, and offline-mode behavior for a signed-in Traveler is the `sync` feature's concern, not this slice's.

## 4. User stories

### US-01: Sign up without a password

**As a** Traveler
**I want** to create an account using Google, GitHub, or a magic-link email — no password
**So that** I can start using daysleft without creating or remembering a password

### US-02: Same account regardless of method

**As a** Traveler
**I want** signing in with a different method under the same email to reach my existing account
**So that** I never end up with duplicate accounts or lose access to my data

### US-03: Return to what I was doing after login

**As a** Traveler
**I want** to land back on the page I was trying to reach after I finish signing in
**So that** I don't lose my place or have to navigate back manually

### US-04: Dashboard is private

**As a** Traveler
**I want** the dashboard to be reachable only when I'm signed in
**So that** my (future) trip and day-count data stays private

### US-05: Log out completely on this device

**As a** Traveler
**I want** logging out from the header to fully end my session on this device
**So that** nobody using this browser afterward can see my account

### US-06: See a clear empty dashboard

**As a** Traveler
**I want** the dashboard to clearly show I have nothing tracked yet, right after I sign up
**So that** I understand the app worked and know what to do next

### US-07: Interface in my language

**As a** Traveler
**I want** the app shell to render in a language it supports (English today)
**So that** the interface makes sense to me, and more languages can be added later without rework

## 5. Acceptance criteria

### AC-01 (US-01) — happy path

**Given** a person uses Google, GitHub, or a magic-link email to authenticate — whether or not they've done so before
**When** they complete the chosen method
**Then** the system signs them into their account, creating one on first use, and shows them the dashboard

### AC-01b (US-01) — error

**Given** a Traveler authenticates via Google or GitHub but declines or revokes the provider's consent, or the provider is unavailable when the callback returns
**When** the sign-in attempt fails
**Then** the system tells the Traveler sign-in didn't complete and lets them retry with any supported method

### AC-02 (US-01) — error

**Given** a Traveler clicks a magic-link email more than 15 minutes after it was sent, that was already used, or that was superseded by a newer link request for the same email
**When** they attempt to complete sign-in with it
**Then** the system blocks the sign-in, tells the Traveler the link is no longer valid, and offers to send a new one

### AC-02b (US-01) — happy path

**Given** a Traveler requests a magic-link on one device and opens it on a different device or browser
**When** they complete sign-in from the link
**Then** the system signs them in there and shows them the dashboard directly, without attempting to return them to the original device

### AC-03 (US-02) — domain invariant

**Given** an email address already linked to an existing Traveler account via one method (e.g. Google)
**When** the same person signs in using a different method (e.g. magic-link) with that same verified email
**Then** the system signs them into their existing account rather than creating a second one, and tells them they've signed in to their existing account

### AC-03b (US-02) — domain invariant

**Given** a Traveler attempts to sign in via an OAuth provider that does not return a verified email address
**When** the sign-in attempt is made
**Then** the system blocks account creation, tells the Traveler an email is required, and asks them to make one visible/verified with that provider before retrying

### AC-04 (US-03) — happy path

**Given** an unauthenticated visitor is redirected to login while trying to reach the dashboard, and completes sign-in in that same browser (via OAuth, or a magic-link opened there)
**When** they complete sign-in
**Then** the system returns them to the dashboard page they originally requested, not a generic landing page

### AC-05 (US-04) — authorization

**Given** no Traveler session exists, or an existing session has expired or is no longer valid
**When** a visitor requests the dashboard directly
**Then** the system denies access, reveals no account or dashboard data, and redirects them to sign in, preserving the page they were trying to reach the same way AC-04 does

### AC-06 (US-05) — happy path

**Given** a signed-in Traveler selects log out from the header
**When** the action completes
**Then** the system ends their session on that browser server-side (not only a client-side cookie clear), and the dashboard is no longer reachable from that browser without signing in again; sessions on other devices are unaffected

### AC-07 (US-06) — cross-context

**Given** a Traveler has recorded no trips yet
**When** they view the dashboard
**Then** the system shows an explicit "nothing tracked yet" empty state, not an error or a blank page

### AC-08 (US-07) — happy path

**Given** a Traveler's browser is set to a language the app supports
**When** they reach any app screen
**Then** the shell renders in that language, falling back to English when the browser's language isn't supported

## 6. Non-functional requirements

| Aspect | Target | Measurement |
|---|---|---|
| Latency p95 auth handoff (start sign-in → provider/redirect shown) | ≤ 300 ms | server timing metric on the sign-in initiation |
| Latency p95 dashboard first render after successful auth | ≤ 500 ms | client navigation timing, post-auth |
| Throughput | ≥ 5 req/s per instance | smoke test in CI against the combined auth-handoff + dashboard-render endpoints |
| Availability | 99.5% | synthetic uptime probe against the login page, monthly SLO window |
| Account uniqueness | 0 duplicate accounts per verified email | monitored: duplicate-account count per verified email, target 0 |
| Session duration | 7-day sliding expiry (renews on activity) | session-store expiry field, verified in tests |
| Magic-link duration | ≤ 15 min, single-use; a new request for the same email invalidates prior outstanding links | link-store expiry + supersede check, verified in tests |
| Magic-link send rate | ≤ 5 requests per email address per hour | rate-limit counter per email address |

## 6.1 Security / privacy

- **Data classification:** confidential — this is the app's first collection of personally identifying data (email, sign-in identity).
- **Personal data touched:** email address (from OAuth provider or magic-link), OAuth provider account identifier, session token, browser-reported locale.
- **AuthZ/AuthN impact:** introduces the app's first authentication boundary — a valid session is required to reach the dashboard route. Only one role exists (Traveler); no differentiated permissions within the app yet.
- **Abuse cases:**
  - open redirect via the post-login return-to destination: system only follows a return-to destination whose resolved URL shares this app's own origin (scheme, host, and port); anything else is discarded in favor of the default dashboard destination.
  - magic-link send abuse (unauthenticated relay/spam): system rate-limits magic-link sends to ≤5 per email address per hour (§6); a Traveler hitting the limit is told to wait rather than the system silently succeeding or failing.
  - stale session survives logout: system invalidates the session server-side on the browser that logged out, so a cached or previously-open tab on that browser can't keep using it (AC-06); other devices are unaffected — a global all-devices revoke is explicitly out of scope (§3).
  - account takeover via email confusion: the system only links a new sign-in method to an existing account when the email is verified by the method itself (OAuth-verified email, or a clicked magic-link), never on an unverified claim; an OAuth provider that returns no verified email is blocked from creating or linking an account (AC-03b).
- **Security review:** Required — first authentication boundary and first PII collection in the app.

## 7. Metrics / KPIs

- **Signup → first-dashboard-view completion rate** — baseline: 0 (new feature), target: ≥80% within 30 days of launch.
- **Auth attempt failure rate** (OAuth/magic-link errors of any kind) — baseline: 0 (new feature; measured from first production traffic), target: <5% within 30 days of launch.
- **Return-to-destination accuracy** (Traveler lands back on the page they originally requested after login) — baseline: 0 (new feature), target: ≥95% within 30 days of launch.
- **Post-logout access reports** (any report of dashboard access after logout on the same device) — baseline: 0, target: stays at 0 on an ongoing basis.

## 8. Open questions

- [ ] Which managed auth solution implements OAuth + magic-link (a specific provider vs. rolling it on the app's own auth library)? Default now: undecided, `architecture-map.md` currently names one option but the user expressed a preference for another — resolve as a `design`-stage ADR. — owner: Tech Lead, due: before `sdd:design auth-user-plus-dashboard`
- [ ] Should the account schema pre-allocate for future roles (staff, family/group accounts) even though they're out of scope now? Default now: no — single Traveler role only, no pre-built role column. — owner: Tech Lead, due: before `sdd:data-model auth-user-plus-dashboard`
- [ ] Any OAuth providers beyond Google and GitHub for this slice? Default now: Google + GitHub only. — owner: PM, due: before `sdd:design auth-user-plus-dashboard`
- [ ] Which language ships second, and when? Default now: none scheduled — infra ships now, content is future work. — owner: PM, due: when a localization feature is added to the roadmap
