---
id: T5
title: "Add the list-tracked-destinations use case"
layer: "app"
deps: ["T4"]
acs: ["AC-03", "AC-07", "AC-10", "AC-11"]
files_hint: ["src/modules/destinations/app/list-tracked-destinations.ts"]
owner: "Tech Lead"
estimate: "S"
status: "todo"
---

# T5 — Add the list-tracked-destinations use case

## Why

Reads the signed-in Traveler's list, returning a typed `{ status, body }` result the route
serializes ([sad.md §5](../sad.md); [sad.md §6](../sad.md) "opening the list").

## What

Add `list-tracked-destinations.ts`: given an injected repository and the caller's user id, return
the ordered list on success, or a distinct recoverable-error result on failure — never conflating
the two (AC-11's confirmed-empty vs. read-failed distinction).

## Definition of Done

- [ ] unit tests assert the result preserves repository order (already tie-broken by id, T4)
- [ ] unit tests assert a confirmed-empty result and a read-failure result are distinct typed
      outcomes — the caller can tell them apart without inspecting array length
- [ ] lint + vet clean

## Notes

The first-run screen (AC-10) and the recoverable error (AC-11) both read this use case's result —
keeping the two outcomes structurally distinct here is what stops the two screens leaking into
each other downstream (T9, T18).
