---
status: Draft
owner: "Tech Lead"
reviewers: ["Tech Lead"]
updated_at: "2026-09-06"
feature_size: "M"
---

# Test plan — dashboard-countries-list

A Traveler adds, lists, opens and permanently removes tracked destinations from a five-entry
catalogue, with every change shown only once the system has confirmed it (spec.md §1, §5).
`target_surfaces: [backend-service, web-frontend]` (sad.md frontmatter) — this plan carries the
backend tiers (unit / integration / contract / e2e) and the frontend "testing trophy" tiers
(component / visual-regression / e2e-through-UI, sad.md §2 confirms a UI surface).

## Levels

| Level | Scope | Strategy (generic — no tool names) |
|---|---|---|
| Unit | App-layer use cases (T3, T5–T8), the catalogue lookup, the UUIDv7 helper (T2) — no I/O. | In-memory, no external dependency; a fake repository where a use case needs one. |
| Integration | The `TrackedDestinationsRepository` (T4) and the two API route handlers (T9, T10) against a real database. | An in-process real Postgres already available in this repo (`@electric-sql/pglite`, sad.md §2) — not a mock. Each test runs inside its own transaction that is rolled back at the end, so tests never share state and nothing needs recreating between them. |
| Contract | The `/api/v1/destinations*` request/response shapes against `contracts/openapi.yaml`. | Validate each route's real response against the OpenAPI schema — no hand-rolled stub of the shape. |
| E2E | One full flow end to end, driven at the API layer (one per sad.md §6 runtime flow, backend side). | The route handlers exercised over HTTP against the same ephemeral-transaction database as Integration. |
| Load | N/A as a sustained-rate scenario — see NFR validation below. | — |
| Component *(UI surface)* | Modal (T12), DestinationList/Drawer (T15), Picker (T16), RemoveConfirmation (T17), Detail/FirstRun/Unavailable (T18) — each screens.md state in isolation. | Render in a component harness; assert output + interaction, no full app boot. `axe-core` runs alongside as part of the same suite for the three overlay surfaces. |
| Visual-regression | N/A this pass — `docs/design-system.md` records `code` (inline markdown wireframes) as the tool choice, with no visual-diff baseline established yet; screens.md's own wireframes are the only visual reference. | — |
| E2E-through-UI | One per sad.md §6 critical flow, driven through the rendered UI, not the API directly. | The flow exercised through the real UI against the same ephemeral-transaction database. Narrow-screen behavior (US-06) is folded into these six as a viewport variant on one flow rather than doubling every flow — see Decision log. |

## AC coverage

| AC (spec.md §5) | Test name (intent-based) | Level | Expected outcome |
|---|---|---|---|
| AC-01 — add, happy path | a supported reference records and appears in the list once confirmed, including a duplicate destination | unit + integration + e2e + component + e2e-through-UI | the new tracked destination is recorded, shown in the list, and its detail view opens with focus moved there; a repeat of an already-tracked destination creates a separate record |
| AC-02 — add, error | an unsupported reference is refused for any caller, not just the picker | unit + contract + component | nothing is recorded; the caller is told only supported destinations can be tracked |
| AC-03 — list, happy path | the list renders in recorded order, tie-broken by id, on every device | integration + e2e-through-UI | every tracked destination appears, most recent last, in the same order regardless of which device reads it |
| AC-04 — add action always available | the add action is present at the end of the list at every screen width | component | the add action opens the picker over the current view without navigating away, at both widths |
| AC-05 — reload returns to the open destination | reloading or revisiting a saved address reopens the same tracked destination | e2e-through-UI | the same destination's detail view opens again, not the top of the list |
| AC-06 — saved address, not-yours/removed/never-existed | all three miss causes produce one identical outcome | integration + contract + e2e-through-UI | nothing is selected, the address is replaced with the plain home address, and one identical message is shown — no difference in status, code, or wording between the three causes |
| AC-07 — list with nothing selected | arriving with nothing open invites a choice | component + e2e-through-UI | the list shows with no selection; on a narrow screen the drawer opens itself |
| AC-08 — remove, happy path | a confirmed removal disappears from the list only once recorded | unit + integration + e2e + component + e2e-through-UI | the tracked destination is deleted, disappears from the list, and the Traveler lands in the nothing-selected state |
| AC-09 — delisted destination still resolves | a tracked destination whose catalogue entry was later delisted still opens and can still be removed | unit + integration | the destination opens under its original name and can be removed; it cannot be added again |
| AC-10 — first-run screen | a Traveler with nothing tracked sees one clear action, not an empty list | component + e2e-through-UI | the first-run screen shows with a single add action; adding one moves to the list with that destination open; removing the last one returns to the first-run screen |
| AC-11 — recoverable read error | any read failure other than an invalid sign-in shows one error with retry | unit + component + e2e-through-UI | one error presentation appears with a Traveler-driven retry; nothing retries on its own; the first-run screen never appears in this state |
| AC-12 — overlay accessibility & focus | the list drawer, add picker and removal confirmation all share one focus contract | component | focus enters each surface on open, returns to the invoking control on close, Escape closes each; zero serious/critical accessibility violations on all three |
| AC-13 — unauthenticated visitor | a visitor with no valid sign-in learns nothing | contract + e2e-through-UI | the visitor is sent to sign in and, after signing in, returns to the address they were trying to reach; nothing about any Traveler's tracked destinations is revealed |
| AC-14 — session invalidated mid-use | a confirmed invalid sign-in wins over every other outcome | unit + integration + e2e-through-UI | the Traveler is sent to sign in and tracked destinations stop showing, even if an add/remove/read was in flight |
| AC-15 — sign-out discards the previous Traveler's data | nothing of a previous Traveler survives a confirmed sign-out on the same device | e2e-through-UI | a second sign-in (same or different Traveler) never shows, even momentarily, anything held for the Traveler who just signed out |
| AC-16 — detail view, nothing recorded yet | opening a tracked destination states plainly that nothing is recorded | component | the destination's name shows with a "nothing recorded yet" statement, no day-count, no trips, no promise about future releases |
| AC-17 — remove, error | a removal that cannot complete leaves the list unchanged with an unambiguous message | unit + component + e2e-through-UI | the tracked destination remains exactly as it was; one message states plainly it was not removed |

## Edge cases / error paths

- Missing or malformed `trackedDestinationId` in the detail address → same `destinations.not_found` outcome as AC-06 (no early rejection on identifier shape — ADR-0008).
- `destination_ref` missing entirely from the add request body → refused the same way as an unsupported reference (AC-02) — the app-layer check runs regardless of what shape the missing field takes.
- The read (list or by-id) fails while a sign-in is otherwise valid — offline, a server fault, a timeout, an unreadable answer → the one recoverable-error presentation (AC-11), never the first-run screen.
- A removal is confirmed by the Traveler but the delete fails at the repository layer → the row stays, one not-removed message shows (AC-17), never a silent no-op or a duplicate removed row.
- The list read confirms with zero records vs. the same read failing entirely → these must resolve to two structurally distinct outcomes (first-run screen vs. recoverable error, AC-10 vs. AC-11) — never inferred from an empty array that could also mean "unknown".
- A saved address resolves during the same request window as that Traveler's sign-in expiring (AC-14 vs. AC-06 ordering) → the confirmed-invalid-sign-in outcome takes precedence over the not-found outcome.
- A 500-entry tracked-destinations list (spec.md §6 List size NFR) → every row stays keyboard-reachable, the list renders within the first row's budget, and scrolling stays responsive (component test with a 500-row fixture).

## Test data

- Seed strategy: `newTrackedDestination(overrides?)` and the existing `newUser()`-style fixture (data-model.md "Test fixtures"), producing a UUIDv7 id, a `userId`, a `destinationRef` defaulted to one of the five catalogue entries, and `createdAt` defaulted to `new Date()`. No real-looking PII — `user-<uuid>@example.test` style emails, matching the existing `users` fixture convention.
- Integration dependency: the in-process real Postgres already available in this repo (`@electric-sql/pglite`) — not a mocked store.
- Cleanup boundary: **per-test transaction rollback** — each integration/e2e test opens a transaction, runs against it, and rolls it back at teardown, so no test's writes are visible to any other test and nothing needs recreating between runs.

## NFR validation (load)

<!-- Both numeric NFRs in spec.md §6 are single-run latency budgets, not sustained-throughput
targets — spec §3 explicitly excludes production timing measurement, and sad.md §10 QG-3 already
commits to verifying both as one timed run against a stubbed network. Per the confirmed decision
below, these are represented as single-run assertions inside the e2e-through-UI tests, not as a
separate Load-level scenario. -->

- Showing the list completes within 500 ms → asserted as a single clocked run inside the
  "opening the list" e2e-through-UI test, against a stubbed network (spec.md §6).
- A confirmed add or removal completes within 800 ms from the Traveler's action to the list
  reflecting the confirmed result → asserted as a single clocked run inside the "add" and
  "remove" e2e-through-UI tests, against a stubbed network (spec.md §6).
- The 500-tracked-destination list-size NFR is not a load scenario either — it is the fixture-based
  component test named under Edge cases above (operable at 500 rows, not a request-rate target).

<!-- N/A: no sustained-throughput or concurrent-rate NFR exists — spec.md §6 marks Throughput and
Availability both N/A, so no dedicated Load-level scenario is written. -->

## CI placement

- On every PR: unit, contract, component (fastest suites; catches most regressions cheapest).
- On every PR (kept fast by ephemeral in-process Postgres + transaction rollback): integration.
- On schedule / pre-release: e2e, e2e-through-UI (the six sad.md §6 flows, including the
  narrow-viewport variant) — heaviest suites, each boots the real app.

## Decision log

- **Integration dependency:** real database (in-process, already in the repo), never a mock —
  each test isolated by a per-test transaction rollback rather than recreating the database per
  suite. (Confirmed with the user, overriding the plan's own two proposed defaults.)
- **Timing NFRs (500 ms / 800 ms):** represented as single-run e2e assertions, not a Load-level
  scenario — matches spec §3's exclusion of production timing and sad.md §10 QG-3's own framing.
- **E2E-through-UI scope:** one test per sad.md §6 critical flow (six total, covering US-01–US-05
  and US-07); US-06's narrow-screen behavior is folded into one flow as a viewport variant rather
  than doubling all six, with the drawer's own open/close/focus contract left to T12/T15's
  component tests.
