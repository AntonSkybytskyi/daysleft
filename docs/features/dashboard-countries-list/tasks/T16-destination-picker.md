---
id: T16
title: "Build DestinationPicker (SCR-02, add action)"
layer: "ui"
deps: ["T12", "T14"]
acs: ["AC-01", "AC-02", "AC-04", "AC-12"]
files_hint: ["src/modules/destinations/ui/DestinationPicker.tsx"]
owner: "Tech Lead"
estimate: "M"
status: "todo"
---

# T16 — Build DestinationPicker (SCR-02, add action)

## Why

Presents the five catalogue entries over the current view without navigating away
([screens.md](../screens.md) SCR-02; [spec AC-04](../spec.md)).

## What

Add `DestinationPicker.tsx` inside the T12 `Modal`: one control per catalogue entry (from T3 via
the query layer's add mutation, T13), a `submitting` state per entry chosen, and an inline error
on `422`/other failure without closing.

## Definition of Done

- [ ] component tests assert choosing an entry submits and nothing is added to the list until the
      mutation confirms (no optimistic row)
- [ ] component tests assert an unsupported-reference or other failure response shows the inline
      error and keeps the picker open
- [ ] component tests assert a confirmed add opens the new destination's detail view and moves
      focus there, closing the picker (and the list drawer on a narrow screen)
- [ ] `axe-core` reports 0 serious/critical violations
- [ ] lint + vet clean

## Notes

Reachable from SCR-01, SCR-03, SCR-04 and SCR-05's add action (AC-04) — this task builds the
picker itself; T19 wires its entry points into the pages.
