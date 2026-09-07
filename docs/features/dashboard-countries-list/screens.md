---
status: draft
feature_size: "M"
tool: "code"
updated_at: "2026-09-06"
---

# Screens — dashboard-countries-list

> The canonical **screen manifest** — every screen in every state — produced by `screens` (between
> `api` and `tasks`) and read by `tasks` (each `ui` task cites SCR ids + states), `implement`
> (builds the screen to the declared states) and `review` (the built screen must match this).
> Downstream stages reference **only this manifest** — never a raw design file.

## Source

- **Tool:** code (from `docs/design-system.md`)
- **File:** inline wireframes below — no Figma/Pencil MCP connected; `docs/design-system.md`
  itself records this as the committed choice, not a session degradation.

## Shared loading state

Before the opening read (`sad.md §6` "opening the list") confirms, the content area shows one
shared loading treatment — a standalone `Spinner` where the list/first-run/error screen will
render. AC-11 fixes that the first-run screen (SCR-01) and the error screen (SCR-07) are never
reached except by *confirmed* outcomes, so this loading state belongs to the composing container
(`DestinationsContainer`), not to any one SCR — each screen's table below marks its own `loading`
row as `N/A`, pointing back here, rather than repeating the same wireframe three times.

```text
+--------------------------------------+
| [Spinner]                            |
+--------------------------------------+
```

## Screens

### SCR-01 — First-run screen

| State | Trigger / condition | Components (from the inventory) | Source-ref |
|---|---|---|---|
| default | Confirmed-empty read (AC-10), or the last tracked destination was just confirmed removed (AC-08/AC-10 tail, `sad.md §6` "removing a tracked destination") | `EmptyState`, `Button` | wireframe below |
| loading | N/A — see §Shared loading state; AC-11 forbids showing this screen before the read is confirmed | — | — |
| error | N/A — a failed read renders SCR-07 instead; this screen is reached only by a *confirmed* empty read (AC-11) | — | — |

```text
+--------------------------------------+
| Nothing tracked yet.                 |
| Add the first destination you need   |
| to keep an eye on.                   |
|                                       |
| [ Add a destination ]                |
+--------------------------------------+
```

### SCR-02 — Destination picker

| State | Trigger / condition | Components (from the inventory) | Source-ref |
|---|---|---|---|
| default | The add action on SCR-01, SCR-03, SCR-04 or SCR-05 (AC-04); opens over the current view, never navigating away | `NEW: Modal`, `Button` (one per catalogue entry) | wireframe below |
| submitting | A catalogue entry was chosen; `POST /api/v1/destinations` in flight (`sad.md §6` critical flow 1) | `Button` (`loading`) | wireframe below |
| error | `422 destinations.unsupported_reference` (AC-02) or the generic recoverable-error case (contract `401`/`500`, `sad.md §6` critical flow 1) | `Alert` (`error`) | wireframe below |
| empty | N/A — the catalogue is a fixed five-entry constant (ADR-0006); it is never empty | — | — |

```text
default / submitting:
+--------------------------------------+
| Add a destination            [Esc x] |
| ( ) Schengen                         |
| ( ) Thailand                         |
| ( ) Vietnam            [Spinner]     |
| ( ) Malaysia                         |
| ( ) Indonesia                        |
+--------------------------------------+

error:
+--------------------------------------+
| Add a destination            [Esc x] |
| [Alert] Only the destinations the    |
|  app supports can be tracked.        |
| ( ) Schengen ...                     |
+--------------------------------------+
```

### SCR-03 — List view, nothing selected

| State | Trigger / condition | Components (from the inventory) | Source-ref |
|---|---|---|---|
| default | Confirmed read with ≥1 record and nothing selected (AC-07) — first arrival with no saved address, or after removing the open destination | `NEW: DestinationList` | wireframe below |
| rejected-address | Arrived here because a saved address named a not-yours/removed/never-existed record (AC-06); the address was replaced with the plain home address | `NEW: DestinationList`, `Alert` (`error`) | wireframe below |
| loading | N/A — see §Shared loading state | — | — |
| empty | N/A — a confirmed read with zero records renders SCR-01 instead (`sad.md §6` "opening the list") | — | — |
| error | N/A — a failed read renders SCR-07 instead (`sad.md §6` "opening the list") | — | — |

```text
default:
+------------------+-------------------+
| Your destinations | Choose a         |
| Thailand           | destination      |
| Vietnam            | from your list.  |
| [ + Add ]          |                  |
+------------------+-------------------+

rejected-address:
+------------------+-------------------+
| Your destinations | [Alert] That     |
| Thailand           | destination     |
| Vietnam            | isn't available.|
| [ + Add ]          |                  |
+------------------+-------------------+
```

### SCR-04 — Destination detail view

| State | Trigger / condition | Components (from the inventory) | Source-ref |
|---|---|---|---|
| default | Chosen from SCR-03/SCR-05 (`sad.md §6` "selecting a tracked destination from the list", cache-only, no wait), or a confirmed add (AC-01), or a confirmed saved address (AC-05, AC-16) | `EmptyState` (heading = destination name, body = "Nothing is recorded for this destination yet."), `Button` (remove action) | wireframe below |
| loading | Reached via a saved address (`sad.md §6` "resolving a saved address") — see §Shared loading state, rendered in the content area while that read is in flight | — | — |
| error | N/A — a saved address that resolves to nothing redirects to SCR-03 rather than rendering this screen in an error state (AC-06) | — | — |

```text
+--------------------------------------+
| Thailand                             |
| Nothing recorded for this            |
| destination yet.                     |
|                                       |
| [ Remove ]                           |
+--------------------------------------+
```

### SCR-05 — List drawer (narrow screen)

| State | Trigger / condition | Components (from the inventory) | Source-ref |
|---|---|---|---|
| default | The list control in the app shell's header, or arriving at SCR-03 on a narrow screen (AC-07, AC-12) — focus moves in on open | `NEW: Modal`, `NEW: DestinationList`, `Button` (add) | wireframe below |
| loading | N/A — the drawer is entered only once the opening read is already confirmed (SCR-03's precondition); see §Shared loading state for what precedes it | — | — |
| empty | N/A — same as SCR-03: zero records routes to SCR-01, not the drawer | — | — |
| error | N/A — same as SCR-03: a failed read routes to SCR-07, not the drawer | — | — |

```text
+--------------------------------------+
| Your destinations             [x]    |
| Thailand                             |
| Vietnam                              |
| [ + Add ]                            |
+--------------------------------------+
   (overlays the content; Escape or
    choosing a destination closes it
    and returns focus per AC-12)
```

### SCR-06 — Removal confirmation

| State | Trigger / condition | Components (from the inventory) | Source-ref |
|---|---|---|---|
| default | The remove action on SCR-04 (AC-08); names the destination being removed | `NEW: Modal`, `Button` (confirm), `Button` (cancel) | wireframe below |
| submitting | Confirmed; `DELETE /api/v1/destinations/{id}` in flight | `Button` (`loading`) | wireframe below |
| error | Removal could not complete (AC-17; contract `500`) — the destination stays exactly as it was and the message never leaves it ambiguous | `Alert` (`error`) | wireframe below |

```text
default / submitting:
+--------------------------------------+
| Remove Thailand?              [Esc x]|
| This can't be undone.                |
| [ Cancel ]  [ Remove ]  <- [Spinner] |
+--------------------------------------+

error:
+--------------------------------------+
| Remove Thailand?              [Esc x]|
| [Alert] It wasn't removed. Try again.|
| [ Cancel ]  [ Remove ]                |
+--------------------------------------+
```

### SCR-07 — List unavailable

| State | Trigger / condition | Components (from the inventory) | Source-ref |
|---|---|---|---|
| default | Any read that fails without a confirmed invalid sign-in (AC-11; contract `500` on `listTrackedDestinations`/`getTrackedDestination`) — one presentation whatever the cause, with a Traveler-driven retry | `Alert` (`error`), `Button` (retry) | wireframe below |
| retrying | The Traveler chose retry; the read is in flight again | `Alert` (`error`), `Button` (`loading`) | wireframe below |
| empty | N/A — this is a failure presentation, not an empty-list one; a confirmed-empty read renders SCR-01 (`sad.md §6` "opening the list") | — | — |

```text
+--------------------------------------+
| [Alert] Something went wrong loading |
|  your destinations.                  |
| [ Retry ]                            |
+--------------------------------------+
```

### SCR-08 — Sign-in

External — owned by the shipped `auth-user-plus-dashboard` feature. Its own `screens.md` covers
its states; this feature draws it only as an entry point (no valid sign-in, or a sign-in
confirmed invalid mid-use — AC-13, AC-14) and an exit point (`return_to` brings the Traveler back
to the address they were trying to reach, per that feature's contract).

## New components

| Component | Why no existing primitive fits | Registered in design-system |
|---|---|---|
| `Modal` | The overlay focus contract (focus in on open, focus back to the invoking control on close, Escape closes) all three overlay surfaces share (`sad.md §5`, ADR-0004) — nothing in the current inventory (`Button`, `Alert`, `EmptyState`, …) provides dialog/focus-trap behavior. | pending — `implement` registers it |
| `DestinationList` | Renders a Traveler's tracked destinations as a navigable list of rows, each opening its own detail view — no list/collection primitive exists in the inventory today (its members are all single-control components). | pending — `implement` registers it |
