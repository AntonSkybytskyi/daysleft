---
id: T17
title: "Build RemoveConfirmation (SCR-06)"
layer: "ui"
deps: ["T12", "T14"]
acs: ["AC-08", "AC-12", "AC-17"]
files_hint: ["src/modules/destinations/ui/RemoveConfirmation.tsx"]
owner: "Tech Lead"
estimate: "S"
status: "todo"
---

# T17 — Build RemoveConfirmation (SCR-06)

## Why

Names the destination being removed and confirms before the hard delete
([screens.md](../screens.md) SCR-06; [spec AC-08](../spec.md), AC-17).

## What

Add `RemoveConfirmation.tsx` inside the T12 `Modal`: names the destination, confirm/cancel
actions wired to the remove mutation (T13), `submitting` state, and an unambiguous not-removed
message on failure.

## Definition of Done

- [ ] component tests assert the destination stays in the list until the removal confirms (no
      optimistic disappearance)
- [ ] component tests assert a failed removal shows one message stating plainly it was not
      removed, with the row unchanged
- [ ] component tests assert a confirmed removal closes the confirmation and returns the Traveler
      to the no-selection state
- [ ] `axe-core` reports 0 serious/critical violations
- [ ] lint + vet clean

## Notes

Opened only from `DestinationDetail` (T18)'s remove action.
