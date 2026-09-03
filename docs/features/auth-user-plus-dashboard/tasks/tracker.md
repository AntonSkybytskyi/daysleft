# Tracker — auth-user-plus-dashboard

> Status of every task in the epic. `implement` updates `done` as it commits each task.
> States: `todo` · `in_progress` · `blocked` · `review` · `done`.

| # | Task | Layer | Owner | Estimate | Blocked by | Status |
|---|---|---|---|---|---|---|
| T1 | Promote staged users migration to live | migration | Backend Lead | S | — | todo |
| T2 | Account-linking invariant (pure fn) | domain | Backend Lead | S | — | todo |
| T3 | Drizzle users repository | infra | Backend Lead | M | T1, T2 | todo |
| T4 | Clerk SDK + Svix verification wiring | infra | Backend Lead | S | — | todo |
| T5 | Clerk webhook route handler | ports | Backend Lead | M | T3, T4 | todo |
| T6 | Session-read helper + create-or-fetch fallback | app | Backend Lead | M | T3, T4 | todo |
| T7 | GET /api/v1/dashboard handler | ports | Backend Lead | S | T6 | todo |
| T8 | POST /api/v1/auth/logout handler | ports | Backend Lead | S | T6 | todo |
| T9 | Return-to origin validation + redirect | wiring | Backend Lead | S | T6 | todo |
| T10 | i18n message catalog + translate() | infra | Backend Lead | S | — | todo |
| T11 | Shared UI primitives (8 components) | ui | Frontend Lead | M | T10 | todo |
| T12 | SCR-01 Login, 5 states | ui | Frontend Lead | M | T11 | todo |
| T13 | SCR-02 Check your email, 4 states | ui | Frontend Lead | S | T11 | todo |
| T14 | SCR-04 Magic-link invalid, 3 states | ui | Frontend Lead | S | T11 | todo |
| T15 | SCR-03 Dashboard, 2 states | ui | Frontend Lead | M | T7, T8, T11 | todo |
| T16 | Security integration tests (QG-1) | tests | Backend Lead | M | T5, T7, T8, T9 | todo |
| T17 | e2e happy-path tests | tests | Frontend Lead | M | T12, T15, T9, T10 | todo |

**Total:** 17 tasks, ~9 person-days.
