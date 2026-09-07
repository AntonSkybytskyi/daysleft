---
id: T12
title: "Build the shared Modal primitive (focus in / focus restore / Escape)"
layer: "ui"
deps: []
acs: ["AC-12"]
files_hint: ["src/modules/ui/Modal/"]
owner: "Tech Lead"
estimate: "M"
status: "todo"
---

# T12 — Build the shared Modal primitive (focus in / focus restore / Escape)

## Why

One hand-rolled primitive gives all three overlay surfaces the same focus contract
([sad.md §5](../sad.md); ADR-0004). Native `<dialog>` is excluded — jsdom 30 here doesn't implement
`showModal` ([sad.md §2](../sad.md)).

## What

Add `src/modules/ui/Modal/` (new shared primitive, zero-dependency, matching the other eight
`src/modules/ui/` primitives): on open, move focus into the modal; on close, return focus to the
invoking control; Escape closes it.

## Definition of Done

- [ ] component tests assert focus enters the modal on open
- [ ] component tests assert focus returns to the invoking control on close
- [ ] component tests assert Escape closes the modal
- [ ] `axe-core` reports 0 serious/critical violations on the primitive in isolation
- [ ] lint + vet clean

## Notes

This is `sad.md §11`'s named risk (shift-tab wrapping, ordering when one surface opens over
another, restoring focus to an unmounted control) — the component tests above are the accepted
mitigation, not a placeholder for a stronger one. Parallel with T1, T2, T3.
