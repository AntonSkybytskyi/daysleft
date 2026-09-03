# Tracker — auth-user-plus-dashboard

> Status of every task in the epic. `implement` updates `done` as it commits each task.
> States: `todo` · `in_progress` · `blocked` · `review` · `done`.

| # | Task | Layer | Owner | Estimate | Blocked by | Status |
|---|---|---|---|---|---|---|
| T1 | Promote staged users migration to live | migration | Backend Lead | S | — | done |
| T2 | Account-linking invariant (pure fn) | domain | Backend Lead | S | — | done |
| T3 | Drizzle users repository | infra | Backend Lead | M | T1, T2 | done |
| T4 | Clerk SDK + Svix verification wiring | infra | Backend Lead | S | — | done |
| T5 | Clerk webhook route handler | ports | Backend Lead | M | T3, T4 | done |
| T6 | Session-read helper + create-or-fetch fallback | app | Backend Lead | M | T3, T4 | done |
| T7 | GET /api/v1/dashboard handler | ports | Backend Lead | S | T6 | done |
| T8 | POST /api/v1/auth/logout handler | ports | Backend Lead | S | T6 | done |
| T9 | Return-to origin validation + redirect | wiring | Backend Lead | S | T6 | done |
| T10 | i18n message catalog + translate() | infra | Backend Lead | S | — | done |
| T11 | Shared UI primitives (8 components) | ui | Frontend Lead | M | T10 | done |
| T12 | SCR-01 Login, 5 states | ui | Frontend Lead | M | T11 | done |
| T13 | SCR-02 Check your email, 4 states | ui | Frontend Lead | S | T11 | done |
| T14 | SCR-04 Magic-link invalid, 3 states | ui | Frontend Lead | S | T11 | done |
| T15 | SCR-03 Dashboard, 2 states | ui | Frontend Lead | M | T7, T8, T11 | done |
| T16 | Security integration tests (QG-1) | tests | Backend Lead | M | T5, T7, T8, T9 | done |
| T17 | e2e happy-path tests | tests | Frontend Lead | M | T12, T15, T9, T10 | done (3 of 4 scenarios NON-red — see e2e/auth-dashboard.spec.ts header: no live Clerk instance in this environment) |

| T18 | Fix open redirect at /login + tautological QG-1 test | wiring | Backend Lead | S | — | done |
| T19 | /sso-callback route (OAuth + magic-link completion) | ui | Frontend Lead | S | T18 | done |
| T20 | /check-email route | ui | Frontend Lead | S | — | done |
| T21 | Render SCR-04 on invalid callback | ui | Frontend Lead | S | T19 | done |
| T22 | Wire AC-01b sign-in-failed error | wiring | Frontend Lead | S | T19 | done |
| T23 | Surface AC-03b email-required error | app | Backend Lead | S | — | done |
| T24 | AC-03 "signed in to existing account" state | ui | Frontend Lead | S | — | done |
| T25 | Wire remaining i18n keys | ui | Frontend Lead | S | — | done |
| T26 | svix-id webhook dedupe | infra | Backend Lead | S | — | done |
| T27 | Distinct email-conflict error code | infra | Backend Lead | S | T26 | done |
| T28 | Thread real return-to path (dashboard 401 + container) | app | Backend Lead | S | — | done |
| T29 | Webhook event-type guard + try/catch | infra | Backend Lead | S | T26, T27 | done |
| T30 | AppError + unified error envelope | app | Backend Lead | M | — | done |
| T31 | Postgres client singleton + env validation | infra | Backend Lead | S | — | done |
| T32 | Magic-link sign-up fallback | ui | Frontend Lead | S | — | done |
| T33 | Swap hand-rolled Svix verify for Clerk SDK helper | infra | Backend Lead | S | T29 | todo |
| T34 | Move return-to validation into auth module | wiring | Backend Lead | S | T18, T28 | todo |
| T35 | Fix migration slot reuse + db:down runner | migration | Backend Lead | S | — | done |
| T36 | Register Alert success variant | docs | Frontend Lead | S | — | done |
| T37 | Replace skipped e2e stubs with real coverage | tests | Frontend Lead | M | T18, T19, T20, T21, T22, T23 | todo |

**Total:** 37 tasks (17 done + 20 review follow-ups), ~9 + ~7 person-days.
