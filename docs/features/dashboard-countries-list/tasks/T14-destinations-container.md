---
id: T14
title: "Build DestinationsContainer (query wiring, error and session routing)"
layer: "ui"
deps: ["T13"]
acs: ["AC-11", "AC-13", "AC-14"]
files_hint: ["src/modules/destinations/ui/DestinationsContainer.tsx"]
owner: "Tech Lead"
estimate: "M"
status: "todo"
---

# T14 — Build DestinationsContainer (query wiring, error and session routing)

## Why

The client container composing the query layer (T13) with the screens
([sad.md §5](../sad.md) internal decomposition).

## What

Add `DestinationsContainer.tsx`: renders the shared loading spinner before the opening read
confirms ([screens.md](../screens.md) "Shared loading state"), routes a confirmed invalid sign-in
to sign-in (taking precedence over the recoverable error, AC-14), and otherwise renders
`ListUnavailable` (T18), `FirstRunScreen` (T18), or the list (T15) per the confirmed read outcome.

## Definition of Done

- [ ] component tests assert the spinner renders before the read confirms
- [ ] component tests assert a confirmed invalid sign-in routes to sign-in even mid-action,
      never rendering the recoverable-error presentation in that case
- [ ] component tests assert any other read failure renders the recoverable error with retry
- [ ] lint + vet clean

## Notes

This is the composition root T15–T18 plug into; it holds no screen-specific markup itself.
