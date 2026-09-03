---
id: T5
title: "Preserve the linked confirmation across a later fetch"
layer: "app"
deps: ["T2", "T3"]
acs: ["AC-04"]
files_hint: ["src/modules/dashboard/app/dashboard-query.ts", "src/modules/dashboard/ui/DashboardContainer.tsx"]
owner: "Frontend Lead"
estimate: "S"
status: "todo"
---

# T5 — Preserve the linked confirmation across a later fetch

## Why

Derives from [spec AC-04](../spec.md) and [sad §6 flow 3's `alt` branch](../sad.md) — the account-linking read's one-shot flag is only true on the first read; a later fetch (e.g. T4's retry) reading `linked: false` must never retract or re-trigger a confirmation already shown.

## What

Track "confirmation already shown this session" once true, independent of the query's current data (e.g. derive the rendered flag as `wasEverLinked || response.linked` rather than reading `response.linked` directly each render). Never re-run any account-linking side effect on the client — the durability is purely about what's rendered.

## Definition of Done

- [ ] component test: once the confirmation is shown, a later fetch (the AC-02 retry) whose response reads `linked: false` still shows it
- [ ] component test: the confirmation is never shown for a Traveler whose response never carried `linked: true`
- [ ] lint + vet clean

## Notes

Shares files with T2/T3/T6 — same lane.
