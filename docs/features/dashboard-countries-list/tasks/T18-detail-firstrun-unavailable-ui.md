---
id: T18
title: "Build DestinationDetail, FirstRunScreen and ListUnavailable (SCR-04, SCR-01, SCR-07)"
layer: "ui"
deps: ["T14"]
acs: ["AC-09", "AC-10", "AC-11", "AC-16"]
files_hint: ["src/modules/destinations/ui/DestinationDetail.tsx", "src/modules/destinations/ui/FirstRunScreen.tsx", "src/modules/destinations/ui/ListUnavailable.tsx"]
owner: "Tech Lead"
estimate: "M"
status: "todo"
---

# T18 — Build DestinationDetail, FirstRunScreen and ListUnavailable (SCR-04, SCR-01, SCR-07)

## Why

Three screens with no shared markup but a shared reason for existing separately: SCR-07 is one
component precisely because it is entered from four different flows and must stay one guarantee
([sad.md §5](../sad.md)).

## What

Add `DestinationDetail.tsx` (names the destination, states nothing recorded yet, remove action
opening T17 — works identically for a delisted reference, AC-09), `FirstRunScreen.tsx` (single add
action opening T16, reachable only from a confirmed-empty read), and `ListUnavailable.tsx` (one
error presentation + retry, same whatever the cause).

## Definition of Done

- [ ] component tests assert `DestinationDetail` states nothing recorded yet, for both a current
      and a delisted `destination_ref`
- [ ] component tests assert `FirstRunScreen`'s add action opens the picker (T16)
- [ ] component tests assert `ListUnavailable` renders the same presentation and a working retry
      for every non-auth failure cause (offline, timeout, server fault, unreadable answer)
- [ ] lint + vet clean

## Notes

None of the three screens fetches on its own — all three are rendered by `DestinationsContainer`
(T14) from the already-confirmed query result.
