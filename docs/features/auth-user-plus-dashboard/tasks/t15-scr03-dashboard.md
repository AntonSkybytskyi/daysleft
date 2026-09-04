---
id: T15
title: "Build SCR-03 Dashboard shell screen, both states, wired to the dashboard and logout handlers"
layer: "ui"
deps: ["T7", "T8", "T11"]
acs: ["AC-06", "AC-07"]
files_hint: ["src/modules/dashboard/ui/"]
owner: "Frontend Lead"
estimate: "M"
status: "todo"
---

# T15 — Build SCR-03 Dashboard shell screen, both states

## Why

[screens.md SCR-03](../screens.md) is the canonical manifest: the empty-state shell for [AC-07](../spec.md), with the header logout action closing the loop on [AC-06](../spec.md).

## What

Compose `Header` (with logout) and `EmptyState` (T11) into the 2 states SCR-03 specifies: `loading` and `default/empty`. Fetch dashboard data from T7's handler; the header's logout button calls T8's handler and redirects to SCR-01 on success.

## Definition of Done

- [ ] component test for both states matches [screens.md SCR-03](../screens.md)'s wireframe content
- [ ] `default/empty` renders "Nothing tracked yet" driven by `has_trips: false` from T7 (AC-07)
- [ ] clicking Log out calls T8's handler and the dashboard is no longer reachable afterward without signing in again (AC-06)
- [ ] lint + vet clean

## Notes

No dedicated error state exists per screens.md — a 401 from T7 redirects to SCR-01's `redirected-sign-in-required` state (T12) rather than rendering in place.
