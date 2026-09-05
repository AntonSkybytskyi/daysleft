---
id: T20
title: "Add cross-cutting quality verification (ordering equivalence, 500-entry NFR, timings)"
layer: "tests"
deps: ["T19"]
acs: ["AC-03", "AC-12"]
files_hint: ["e2e/", "src/modules/destinations/"]
owner: "Tech Lead"
estimate: "M"
status: "todo"
---

# T20 — Add cross-cutting quality verification (ordering equivalence, 500-entry NFR, timings)

## Why

Closes the three verification leaves `sad.md §10` QG-1/QG-2/QG-3 assign to the whole feature
rather than to any one component — `sad.md §11` names the ordering-equivalence gap explicitly as
untested by the per-task assertions alone.

## What

Add a test that adds a record end-to-end and asserts the client-spliced list (T13) exactly
matches a freshly read list (T5) — the ordering-equivalence gap `sad.md §11` names. Add one timed
test run against a stubbed network asserting the list read completes within 500ms and a confirmed
add/removal within 800ms (spec §6). Add an `axe-core` pass across all three overlay surfaces
mounted together, at 0 serious/critical violations.

## Definition of Done

- [ ] ordering-equivalence test passes (spliced list === freshly read list after an add)
- [ ] timed test run asserts both the 500ms and 800ms budgets against a stubbed network
- [ ] combined `axe-core` run across the list drawer, picker and removal confirmation reports 0
      serious/critical violations
- [ ] lint + vet clean

## Notes

This is verification, not new production code — every assertion here rides on components T9,
T10, T13, T15–T18 already built. Per-task DoDs already cover each surface individually; this task
is what `sad.md §11` flags as the one property no single task's DoD could verify alone.
