# Tracker — dashboard-countries-list

> Status of every task in the epic. `implement` updates `done` as it commits each task.
> States: `todo` · `in_progress` · `blocked` · `review` · `done`.

| # | Task | Layer | Owner | Estimate | Blocked by | Status |
|---|---|---|---|---|---|---|
| T1 | Promote the staged tracked_destinations migration and schema | migration | Tech Lead | S | — | done |
| T2 | Add the shared UUIDv7 id-generation helper | infra | Tech Lead | S | — | done |
| T3 | Add the frozen five-entry destination catalogue | app | Tech Lead | S | — | done |
| T4 | Add the TrackedDestinationsRepository and its dependency builder | infra | Tech Lead | M | T1, T2 | done |
| T5 | Add the list-tracked-destinations use case | app | Tech Lead | S | T4 | done |
| T6 | Add the add-tracked-destination use case | app | Tech Lead | S | T3, T4 | done |
| T7 | Add the remove-tracked-destination use case | app | Tech Lead | S | T4 | done |
| T8 | Add the get-tracked-destination-by-id use case | app | Tech Lead | S | T4 | done |
| T9 | Add GET/POST /api/v1/destinations route handlers | ports | Tech Lead | M | T5, T6 | done |
| T10 | Add GET/DELETE /api/v1/destinations/{id} route handlers | ports | Tech Lead | M | T7, T8 | done |
| T11 | Register the new routes in the middleware allowlist | wiring | Tech Lead | S | T9, T10 | done |
| T12 | Build the shared Modal primitive | ui | Tech Lead | M | — | done |
| T13 | Add the destinations client query layer | app | Tech Lead | M | T9, T10 | done |
| T14 | Build DestinationsContainer | ui | Tech Lead | M | T13 | done |
| T15 | Build DestinationList and DestinationListDrawer | ui | Tech Lead | M | T12, T14 | done |
| T16 | Build DestinationPicker | ui | Tech Lead | M | T12, T14 | done |
| T17 | Build RemoveConfirmation | ui | Tech Lead | S | T12, T14 | done |
| T18 | Build DestinationDetail, FirstRunScreen, ListUnavailable | ui | Tech Lead | M | T14 | done |
| T19 | Wire the dashboard pages (home + detail address) | wiring | Tech Lead | S | T11, T15, T16, T17, T18 | done |
| T20 | Add cross-cutting quality verification | tests | Tech Lead | M | T19 | done |

| T21 | Review fix: clear whole query cache on confirmed sign-out (AC-15) | wiring | Tech Lead | S | T13 | done |
| T22 | Review fix: render not-available message on rejected saved address (AC-06) | ui | Tech Lead | S | T19 | done |
| T23 | Review fix: route session-invalid add to sign-in (AC-14) | ui | Tech Lead | S | T14, T16 | done |
| T24 | Review fix: route session-invalid removal to sign-in (AC-14) | ui | Tech Lead | S | T14, T17 | done |
| T25 | Review fix: narrow-screen toggle into header slot (AC-12) | ui | Tech Lead | S | T15 | done |
| T26 | Review fix: close drawer + move focus to detail on add/select (AC-01) | ui | Tech Lead | S | T15, T18 | done |
| T27 | Review fix: ListUnavailable instead of hung spinner on saved-address failure (AC-11) | ui | Tech Lead | S | T18, T19 | done |
| T28 | Review fix: Modal focus trap + top-most-only Escape (AC-12) | ui | Tech Lead | S | T12 | done |
| T29 | Review fix: validate POST body at boundary (AC-02) | ports | Tech Lead | S | T9 | done |

**Total:** 20 tasks, ~10 person-days (one developer, per `sad.md §2` Organisational constraints), plus 9 review-driven follow-up tasks (review-2026-09-06).
