---
id: T3
title: "Add the frozen five-entry destination catalogue"
layer: "app"
deps: []
acs: ["AC-02", "AC-09"]
files_hint: ["src/modules/destinations/app/catalogue.ts"]
owner: "Tech Lead"
estimate: "S"
status: "todo"
---

# T3 — Add the frozen five-entry destination catalogue

## Why

The catalogue is a frozen in-code constant, not a table ([sad.md §5](../sad.md), ADR-0006), and
every write validates against it ([spec AC-02](../spec.md)).

## What

Add `src/modules/destinations/app/catalogue.ts` exporting the five entries (Schengen, Thailand,
Vietnam, Malaysia, Indonesia — each a permanent reference + display name) and a lookup function
that reports whether a given reference is currently supported.

## Definition of Done

- [ ] unit tests assert the catalogue exposes exactly the five named entries
- [ ] unit tests assert the lookup returns false for any reference not in the five
- [ ] lint + vet clean

## Notes

This lookup is what T6 (add use case) calls to enforce AC-02; delisting later only removes an
entry from this constant, never mutates a reference already written (AC-09).
