---
status: Draft
owner: "a.skybytskyi@gmail.com"
reviewers: ["Tech Lead", "Security Lead"]
updated_at: "2026-09-03"
feature_size: "L"
---

# Test plan — auth-user-plus-dashboard

Passwordless account creation (Google/GitHub OAuth or magic-link email) with account-linking by
verified email, a session-gated dashboard shell, complete server-side logout, and a minimal i18n
foundation — the first auth boundary and first PII collection in the app.

## Levels

| Level | Scope | Strategy (generic — no tool names) |
|---|---|---|
| Unit | Pure logic: return-to origin validation, i18n fallback resolution. | In-memory, no external dependency. |
| Integration | `auth`/`dashboard` modules against a real Postgres (the `users` shadow table) and the Clerk webhook handler. | An ephemeral real dependency, e.g. a throwaway DB container spun up per suite. |
| Contract | The `openapi.yaml` boundary — `handleClerkWebhook`, `getDashboard`, `logout`. | Validate real request/response shapes against the agreed contract; no hand-rolled stubs. |
| E2E | N/A for this feature — every critical flow is user-facing (covered by E2E-through-UI below). | — |
| Load | NFR validation — auth-handoff and dashboard-render p95, throughput floor. | The load tool already in your repo, or e.g. k6 or Locust. |
| Component | SCR-01…04 states rendered in isolation (screens.md manifest). | Render in a component harness; assert output + interactions, no full app boot. |
| Visual-regression | SCR-03 empty-state shell (the one state most at risk of an unstyled/broken render, first UI feature). | Snapshot the render; fail on unintended visual diff; update baseline deliberately. |
| E2E-through-UI | Each user-story flow driven through the real UI (ux-flows.md flowcharts). | The flow exercised through the rendered UI against ephemeral dependencies. |

## AC coverage

| AC (spec.md §5) | Test name (intent-based) | Level | Expected outcome |
|---|---|---|---|
| AC-01 — OAuth/magic-link sign-in, first use | first-time Google/GitHub sign-in creates account and reaches dashboard | e2e-through-UI + integration | account row created via webhook upsert, dashboard shown |
| AC-01 — OAuth/magic-link sign-in, repeat use | repeat sign-in with an existing account reaches dashboard without a new row | e2e-through-UI + integration | no duplicate row created, dashboard shown |
| AC-01b — OAuth declined/unavailable | declined consent or provider outage surfaces retry, not a crash | e2e-through-UI + component (SCR-01 error-sign-in-failed) | Traveler told sign-in didn't complete, can retry any method |
| AC-02 — expired/used/superseded magic-link | stale magic-link is rejected with an offer to resend | e2e-through-UI + integration | link rejected, SCR-04 shown, resend available |
| AC-02b — magic-link opened on a different device | link completed on a second device signs in directly | e2e-through-UI | dashboard shown on the second device, no redirect-back attempt |
| AC-03 — account-linking by verified email | second method under the same verified email reaches the existing account | integration + e2e-through-UI | one account row for the email, "signed in to existing account" message shown |
| AC-03b — OAuth provider returns no verified email | unverified-email OAuth sign-in is blocked | integration + component (SCR-01 error-email-required) | account creation/linking blocked, Traveler asked to verify email with provider |
| AC-04 — return-to after login | unauthenticated visitor lands back on originally requested page | e2e-through-UI + unit (origin validation) | requested dashboard page shown post-login, not a generic landing page |
| AC-05 — unauthenticated/expired-session dashboard access | dashboard request with no/expired/invalid session is denied | integration + e2e-through-UI | access denied, no account/dashboard data returned, redirected to login with return-to preserved |
| AC-06 — complete server-side logout | logout ends the session so the same browser can't reach the dashboard | integration + e2e-through-UI | session revoked server-side; post-logout dashboard request on same browser redirected to login; other-device sessions unaffected |
| AC-07 — empty dashboard state | dashboard with no trips shows an explicit empty state | component + visual-regression + e2e-through-UI | "nothing tracked yet" shown, never an error or blank page |
| AC-08 — i18n render + fallback | supported browser language renders the shell; unsupported falls back to English | unit (fallback resolution) + component | shell strings render in the resolved language |

## Edge cases / error paths

- OAuth consent declined → expected: SCR-01 error-sign-in-failed, retry with any method (AC-01b).
- OAuth provider unavailable at callback → expected: same as above, no partial account created (AC-01b).
- Magic-link clicked after 15 minutes → expected: SCR-04, offer to resend (AC-02).
- Magic-link already used → expected: SCR-04, offer to resend (AC-02).
- Magic-link superseded by a newer request for the same email → expected: prior link rejected, SCR-04 (AC-02).
- Magic-link send rate exceeded (>5/email/hour) → expected: SCR-02/SCR-04 error-rate-limited, Traveler told to wait, not silent success/failure (spec §6.1).
- Return-to destination resolves off this app's origin → expected: destination discarded, default dashboard route used instead (open-redirect guard, spec §6.1).
- OAuth provider returns no verified email → expected: account creation/linking blocked, SCR-01 error-email-required (AC-03b).
- Dashboard requested with no session → expected: denied, no data revealed, redirect to login with return-to (AC-05).
- Dashboard requested with an expired/invalid session → expected: same denial as no session (AC-05).
- Clerk webhook delayed past first authenticated request (sad.md §11 risk) → expected: synchronous create-or-fetch fallback on that request, no denial due to a missing shadow row.

## Test data

- Seed strategy: `newTestUser(overrides?)` fixture (data-model.md) — deterministic fake Clerk id + email, with overrides for account-linking / duplicate-email scenarios (AC-03, AC-03b).
- Integration dependency: an ephemeral real Postgres (throwaway container), NOT a mocked store; Clerk itself is stubbed at its SDK/webhook boundary only where the AC is about our own logic (e.g. return-to validation), never for account-linking/session logic which is the behavior under test.
- Cleanup boundary: per-test — truncate/reset the `users` table and any session/webhook fixtures between tests so runs are independent.

## NFR validation (load)

- Auth-handoff latency (start sign-in → provider/redirect shown) ≤ 300 ms p95 → scenario: sustained request rate for the sign-in initiation endpoint over a fixed duration, assert p95 ≤ 300 ms.
- Dashboard first-render latency (post-auth) ≤ 500 ms p95 → scenario: sustained authenticated dashboard requests over a fixed duration, assert client navigation timing p95 ≤ 500 ms.
- Throughput ≥ 5 req/s per instance → scenario: sustain ≥ 5 req/s against the combined auth-handoff + dashboard-render endpoints for a fixed duration, assert no error-rate regression (mirrors the spec §6 CI smoke test).

<!-- Availability (99.5% SLO) is a monitoring/synthetic-probe concern (sad.md §7), not a load-test scenario. -->

## CI placement

- On every PR: unit, contract, component.
- On schedule / pre-release: integration, e2e-through-UI, visual-regression, load.
