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
| T33 | Swap hand-rolled Svix verify for Clerk SDK helper | infra | Backend Lead | S | T29 | done |
| T34 | Move return-to validation into auth module | wiring | Backend Lead | S | T18, T28 | done |
| T35 | Fix migration slot reuse + db:down runner | migration | Backend Lead | S | — | done |
| T36 | Register Alert success variant | docs | Frontend Lead | S | — | done |
| T37 | Replace skipped e2e stubs with real coverage | tests | Frontend Lead | M | T18, T19, T20, T21, T22, T23 | done |

| T38 | Use Clerk's email-link verification API for magic-link completion | ui | Frontend Lead | M | — | done |
| T39 | Close path-traversal bypass in resolveLoginReturnTo | wiring | Backend Lead | S | — | done |
| T40 | Verify webhook signature before consulting dedupe cache | infra | Backend Lead | S | — | todo |
| T41 | Persist second identity so the "linked" banner clears | app | Backend Lead | M | — | todo |
| T42 | Wire SCR-04 i18n strings + add dashboard.errorFetchFailed key | ui | Frontend Lead | S | T38 | todo |
| T43 | Add `linked` field + webhook ignored-event body to openapi.yaml | docs | Backend Lead | S | — | todo |
| T44 | Handle the logout response instead of always redirecting | ui | Frontend Lead | S | — | todo |
| T45 | Fix db:down to actually remove the migration's journal row | migration | Backend Lead | S | — | todo |
| T46 | Distinct error code for the session-side email-conflict case | app | Backend Lead | S | — | todo |
| T47 | Wire Clerk testing-token harness for e2e scenario 3 | tests | Frontend Lead | M | T38 | todo |
| T48 | Fix CheckEmailContainer resend (return_to, sign-up fallback, error labeling) | ui | Frontend Lead | M | T38 | todo |
| T49 | Make SCR-04 "send new link" actually resend | ui | Frontend Lead | S | T38 | todo |
| T50 | Key memoized DB client by connection string | infra | Backend Lead | S | — | todo |
| T51 | Add SCR-03 fetch-failure error state to screens.md | docs | Frontend Lead | S | — | todo |
| T52 | Verify Clerk middleware coverage for /sso-callback + /check-email | wiring | Backend Lead | S | — | todo |

**Total:** 52 tasks (17 original + 20 review-2026-09-03 follow-ups + 15 review-2026-09-03-2 follow-ups); 37 done, 15 todo, ~9 + ~7 + ~6 person-days.
