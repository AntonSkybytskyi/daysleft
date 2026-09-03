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
| T40 | Verify webhook signature before consulting dedupe cache | infra | Backend Lead | S | — | done |
| T41 | Persist second identity so the "linked" banner clears | app | Backend Lead | M | — | done |
| T42 | Wire SCR-04 i18n strings + add dashboard.errorFetchFailed key | ui | Frontend Lead | S | T38 | done |
| T43 | Add `linked` field + webhook ignored-event body to openapi.yaml | docs | Backend Lead | S | — | done |
| T44 | Handle the logout response instead of always redirecting | ui | Frontend Lead | S | — | done |
| T45 | Fix db:down to actually remove the migration's journal row | migration | Backend Lead | S | — | done |
| T46 | Distinct error code for the session-side email-conflict case | app | Backend Lead | S | — | done |
| T47 | Wire Clerk testing-token harness for e2e scenario 3 | tests | Frontend Lead | M | T38 | done (fallback taken — no live Clerk test instance/CI secrets in this environment; scenario's unreachable second half removed, AC-01/AC-07 e2e coverage recorded as explicitly absent, not claimed — see e2e/auth-dashboard.spec.ts) |
| T48 | Fix CheckEmailContainer resend (return_to, sign-up fallback, error labeling) | ui | Frontend Lead | M | T38 | done |
| T49 | Make SCR-04 "send new link" actually resend | ui | Frontend Lead | S | T38 | done |
| T50 | Key memoized DB client by connection string | infra | Backend Lead | S | — | done |
| T51 | Add SCR-03 fetch-failure error state to screens.md | docs | Frontend Lead | S | — | done |
| T52 | Verify Clerk middleware coverage for /sso-callback + /check-email | wiring | Backend Lead | S | — | done |

| T53 | Establish session on second device for magic-link cross-device verify | ui | Frontend Lead | M | — | done |
| T54 | Clear client-side Clerk session on logout | app | Frontend Lead | S | — | done |
| T55 | Persist linked-identity mapping across instances/restarts | data | Backend Lead | M | — | done |
| T56 | Fix openapi.yaml + screens.md drift (round 3) | docs | Backend Lead | S | — | done |
| T57 | SCR-04 resend: sign-up fallback + visible failure state | ui | Frontend Lead | S | — | done |
| T58 | Distinct error message for failed logout | ui | Frontend Lead | S | — | done |
| T59 | migrate-down test exercises the real script | tests | Backend Lead | S | — | done |

| T60 | Deliver AC-02b via originating-device polling (decision: keep AC-02b as written) | ui | Frontend Lead | L | — | done |
| T61 | Stop logout retry loop when signOut() rejects after server 204 | app | Frontend Lead | S | — | done |
| T62 | Re-validate/invalidate persisted linked-identity mappings | data | Backend Lead | M | T55 | done |
| T63 | Join-test AC-03's linked-banner wire (API response → rendered banner) | tests | Frontend Lead | S | — | done |
| T64 | Fix screens.md AC-02b mis-citation + guard migrate-down journal DELETE's `when` (Number.isFinite guard, not re-parameterization — see round-4 review) | docs | Backend Lead | S | — | done |

| T65 | Amend spec/SAD/UX-flows to state AC-02b's originating-device outcome | docs | Backend Lead | S | — | done |
| T66 | Surface visible error instead of silent no-op when /check-email send guard fails | ui | Frontend Lead | S | T60 | done |
| T67 | Non-destructive recovery CTA for sign-up branch's verified-elsewhere screen | ui | Frontend Lead | S | T60 | todo |
| T68 | Scope linked-identity invalidation to email changes + cover canonical-account side | data | Backend Lead | M | T62 | done |
| T69 | Guard /check-email poll against cancellation/unmount races | ui | Frontend Lead | M | T60 | done (remount-resend guard not attempted — see commit body: no verifiable way to detect "already prepared" without clerk-js's un-bundled internal source; open question recorded) |
| T70 | Fix CheckEmailContainer tests to match real Clerk SignInStatus contract + test single-send | tests | Frontend Lead | S | T60 | done |
| T71 | Retry/force-clear client session when signOut() rejects after server 204 | app | Frontend Lead | S | T61 | done |
| T72 | Wire verified-elsewhere screen strings through i18n catalog | ui | Frontend Lead | S | T60 | todo |
| T73 | Clean up dead resend CTA wiring, redundant Clerk import, optional invalidation dependency | docs | Backend Lead | S | T60, T62, T67 | todo |

**Total:** 73 tasks (17 original + 20 review-2026-09-03 follow-ups + 15 review-2026-09-03-2 follow-ups + 7 review-2026-09-03-3 follow-ups + 5 review-2026-09-03-4 follow-ups + 9 review-2026-09-03-5 follow-ups); 64 done, 9 todo.
