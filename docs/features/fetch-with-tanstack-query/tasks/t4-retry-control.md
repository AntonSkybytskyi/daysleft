---
id: T4
title: "Add the retry control to the error state"
layer: "ui"
deps: ["T3"]
acs: ["AC-02"]
files_hint: ["src/modules/dashboard/ui/DashboardContainer.tsx", "src/modules/dashboard/ui/DashboardScreen.tsx"]
owner: "Frontend Lead"
estimate: "S"
status: "todo"
---

# T4 — Add the retry control to the error state

## Why

Derives from [spec AC-02](../spec.md) and [screens.md SCR-01 `error` state](../screens.md) — the recoverable-error state needs one explicit, user-triggered retry control; nothing retries automatically.

## What

`DashboardScreen.tsx`: add a `Button` (label "Try again") to the `error` state, reusing the existing inventory (no new component per [screens.md](../screens.md) §New components). `DashboardContainer.tsx`: wire the button's `onClick` to re-issue T2's query; the button's own `loading`/`disabled` props cover the in-flight retry (no screen-level state change while retrying, per screens.md).

## Definition of Done

- [ ] component test: a non-session-invalid failure shows the error state with one retry `Button`
- [ ] component test: no automatic retry fires after the initial failure
- [ ] component test: triggering the button re-issues exactly one fetch and shows the button's own loading state meanwhile
- [ ] lint + vet clean

## Notes

Shares `DashboardContainer.tsx`/`DashboardScreen.tsx` with T3/T5/T6 — same lane.
