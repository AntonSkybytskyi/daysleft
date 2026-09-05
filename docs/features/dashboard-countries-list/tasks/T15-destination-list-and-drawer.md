---
id: T15
title: "Build DestinationList and DestinationListDrawer (SCR-03, SCR-05)"
layer: "ui"
deps: ["T12", "T14"]
acs: ["AC-03", "AC-04", "AC-07", "AC-12"]
files_hint: ["src/modules/destinations/ui/DestinationList.tsx", "src/modules/destinations/ui/DestinationListDrawer.tsx"]
owner: "Tech Lead"
estimate: "M"
status: "todo"
---

# T15 — Build DestinationList and DestinationListDrawer (SCR-03, SCR-05)

## Why

Renders the confirmed list at both widths and the narrow-screen overlay wrapping it
([screens.md](../screens.md) SCR-03, SCR-05; ADR-0004's Modal contract via T12).

## What

Add `DestinationList.tsx` (rows in recorded order, add action at the end at every width, AC-04)
and `DestinationListDrawer.tsx` (wraps `DestinationList` in the T12 `Modal`, opens itself on a
narrow screen when nothing is selected per AC-07/AC-12).

## Definition of Done

- [ ] component tests assert rows render in the order the query cache holds them (T13)
- [ ] component tests assert the add action is present at every screen width
- [ ] component tests assert the drawer opens itself on a narrow screen when nothing is selected,
      and choosing a destination both opens it and closes the drawer (AC-12)
- [ ] `axe-core` reports 0 serious/critical violations on the drawer
- [ ] a fixture test with 500 tracked destinations asserts every row stays keyboard-reachable, the
      list renders within the first row's budget, and scrolling stays responsive (spec §6)
- [ ] lint + vet clean

## Notes

Rejected-address state ([screens.md](../screens.md) SCR-03) is the alert shown by T19's page
wiring, not a state this component owns itself.
