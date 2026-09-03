# Tracker — fetch-with-tanstack-query

> Status of every task in the epic. `implement` updates `done` as it commits each task.
> States: `todo` · `in_progress` · `blocked` · `review` · `done`.

| # | Task | Layer | Owner | Estimate | Blocked by | Status |
|---|---|---|---|---|---|---|
| T1 | Add TanStack Query dependency and root provider | wiring | Frontend Lead | S | — | todo |
| T2 | Define the dashboard query (conservative, identity-scoped) | app | Frontend Lead | M | — | todo |
| T3 | Migrate DashboardContainer to the query hook | ui | Frontend Lead | M | T1, T2 | todo |
| T4 | Add the retry control to the error state | ui | Frontend Lead | S | T3 | todo |
| T5 | Preserve the linked confirmation across a later fetch | app | Frontend Lead | S | T2, T3 | todo |
| T6 | Clear the identity-scoped cache on logout | app | Frontend Lead | M | T2, T3 | todo |
| T7 | Test DashboardContainer/DashboardScreen | tests | Frontend Lead | M | T3, T4, T5 | todo |
| T8 | Test dashboard-query cache config + logout clear | tests | Frontend Lead | S | T2, T6 | todo |

**Total:** 8 tasks, ~1 person-day.
