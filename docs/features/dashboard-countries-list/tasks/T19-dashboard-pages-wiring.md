---
id: T19
title: "Wire the dashboard pages: home and the detail address"
layer: "wiring"
deps: ["T11", "T15", "T16", "T17", "T18"]
acs: ["AC-05", "AC-06", "AC-13"]
files_hint: ["src/app/dashboard/page.tsx", "src/app/dashboard/[trackedDestinationId]/page.tsx"]
owner: "Tech Lead"
estimate: "S"
status: "todo"
---

# T19 — Wire the dashboard pages: home and the detail address

## Why

`/dashboard` and `/dashboard/[trackedDestinationId]` are the shipped saved addresses AC-05, AC-06
and AC-13 operate on ([sad.md §4](../sad.md) ADR-0002).

## What

Render `DestinationsContainer` (T14) from `src/app/dashboard/page.tsx` (composed by the
`dashboard` module per ADR-0003) and add `src/app/dashboard/[trackedDestinationId]/page.tsx` for
the detail address — a not-yours/removed/never-existed id (T8/T10) replaces the address with
`/dashboard` and shows the one shared message (AC-06); an unauthenticated visit redirects to
sign-in and returns to the original address after success (AC-13).

## Definition of Done

- [ ] e2e test: reloading a saved detail address reopens the same tracked destination (AC-05)
- [ ] e2e test: a not-yours/removed/never-existed address replaces itself with `/dashboard` and
      shows "That destination isn't available." — identical for all three causes (AC-06)
- [ ] e2e test: an unauthenticated visit to either page redirects to sign-in and returns to the
      original address after a successful sign-in (AC-13)
- [ ] lint + vet clean

## Notes

Depends on T11 so the underlying API routes are actually reachable when these pages call them.
