---
status: draft
feature_size: "XS"
tool: "code"
updated_at: "2026-09-03"
---

# Screens — fetch-with-tanstack-query

> Screen manifest for the one screen this feature touches. Read by `tasks` (each `ui` task cites
> SCR ids + states), `implement` (builds to the declared states) and `review` (the built screen
> must match this). No new screen is introduced — this feature changes how SCR-01's existing states
> are reached and adds a retry control to its `error` state; it does not add a new screen.

## Source

- **Tool:** code (from [docs/design-system.md](/docs/design-system.md))
- **File:** inline wireframes below

## Screens

### SCR-01 — Dashboard

The screen already exists (`DashboardScreen.tsx`); its state union (`loading | default | error | error-logout-failed`) is unchanged by this feature — no new top-level state is added. What changes: `error` gains a retry control (spec AC-02), and `default`'s linked-account confirmation now persists across a retry per spec AC-04 (a behavior change, not a new visual state).

| State | Trigger / condition | Components (from the inventory) | Source-ref |
|---|---|---|---|
| loading | Initial fetch on first mount this page load (spec AC-06; sad.md §6 flow 1 cache-miss, flow 3 first fetch) | `Header`, `Spinner` (standalone, centered — existing pattern, unchanged) | wireframe below |
| default | Fetch succeeded, or a cache-hit revisit with no new fetch (spec AC-01); `Alert` success shown when `linked` is true and **stays visible across a later fetch that omits the flag** (spec AC-04) | `Header`, `Alert` (variant `success`, conditional), `EmptyState` (existing — `has_trips` is still hardcoded false) | wireframe below |
| error | Fetch failed for any reason other than a confirmed invalid-session signal — no connectivity, a server-side error, a timeout, an unreadable response (spec AC-02); **now includes one retry control** | `Header`, `Alert` (variant `error`), `Button` (label "Try again", triggers the retry — its own `loading`/`disabled` props cover the in-flight retry per the design-system's acting-control convention; no screen-level state change while retrying) | wireframe below |
| error-logout-failed | The server confirmed logout, but the client-side sign-out step failed (existing state, unchanged — the cache is already cleared per ADR-0002 regardless of this outcome) | `Header`, `Alert` (variant `error`) | wireframe below |
| N/A: session-expired redirect | A confirmed invalid-session signal (spec AC-03) never renders a dashboard state — the Traveler is redirected to sign-in before any state above is shown, same as today | — | — |
| N/A: validation | No form input exists on this screen | — | — |

```text
+------------------------------------------------+
| Header  daysleft                    [Log out]  |
+------------------------------------------------+
|                                                  |
|                    (Spinner)                    |
|                                                  |
+------------------------------------------------+
  loading

+------------------------------------------------+
| Header  daysleft                    [Log out]  |
+------------------------------------------------+
| [Alert success] Signed in to your existing      |
|                  account.                       |
| Nothing tracked yet.                            |
| Future: add your first trip here.               |
+------------------------------------------------+
  default (linked=true shown; omitted when false)

+------------------------------------------------+
| Header  daysleft                    [Log out]  |
+------------------------------------------------+
| [Alert error] Couldn't load your dashboard.     |
|               Check your connection and         |
|               try again.                        |
|               [ Try again ]                     |
+------------------------------------------------+
  error (Button shows its own loading/disabled state while retrying)

+------------------------------------------------+
| Header  daysleft                    [Log out]  |
+------------------------------------------------+
| [Alert error] Couldn't sign you out.            |
|               You're still signed in — try      |
|               again.                            |
+------------------------------------------------+
  error-logout-failed (unchanged)
```

## New components

None — all states compose the existing inventory (`Header`, `Spinner`, `Alert`, `EmptyState`, `Button`). The `error` state's retry control reuses `Button`, already in the inventory with `loading`/`disabled` states — no new primitive needed.
