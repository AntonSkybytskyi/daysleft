---
id: T6
title: "Add the add-tracked-destination use case"
layer: "app"
deps: ["T3", "T4"]
acs: ["AC-01", "AC-02"]
files_hint: ["src/modules/destinations/app/add-tracked-destination.ts"]
owner: "Tech Lead"
estimate: "S"
status: "todo"
---

# T6 — Add the add-tracked-destination use case

## Why

Validates the reference against the catalogue before recording anything, at the app-layer
boundary — a guarantee for any request however it arrives ([spec AC-02](../spec.md); ADR-0006).

## What

Add `add-tracked-destination.ts`: given the caller's user id and a destination reference, refuse
with `destinations.unsupported_reference` (and write nothing) if the catalogue (T3) doesn't
contain it; otherwise generate an id (T2), insert via the repository (T4), and return the
recorded record.

## Definition of Done

- [ ] unit tests submit an unsupported reference directly to this function (bypassing any UI
      picker) and assert it is refused and nothing is written (AC-02's guarantee is for any
      request)
- [ ] unit tests assert a supported reference records and returns the new row, including when the
      caller already has a record for the same reference (AC-01 — no uniqueness rule)
- [ ] lint + vet clean

## Notes

Order of checks matters: catalogue validation happens before any write, never inferred from a
database constraint (ADR-0006 — no CHECK constraint exists).
