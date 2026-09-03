---
id: T3
title: "Migrate DashboardContainer to the query hook"
layer: "ui"
deps: ["T1", "T2"]
acs: ["AC-01", "AC-03", "AC-06"]
files_hint: ["src/modules/dashboard/ui/DashboardContainer.tsx"]
owner: "Frontend Lead"
estimate: "M"
status: "todo"
---

# T3 — Migrate DashboardContainer to the query hook

## Why

Derives from [spec AC-01/AC-03/AC-06](../spec.md), [sad §6 flow 1](../sad.md), [screens.md SCR-01](../screens.md) (`loading`/`default` states). Replaces the hand-rolled `useEffect`+`fetch` with T2's query, preserving today's 401-vs-network-error split.

## What

In `src/modules/dashboard/ui/DashboardContainer.tsx`: replace the `useEffect`+`fetch` with T2's query hook. Keep the existing state dispatch (`loading`/`default`/`error`/`error-logout-failed`) and the confirmed-invalid-session → `router.replace` redirect behavior exactly as today (AC-03) — a query error from any other cause maps to the `error` state (AC-02, wired further in T4), not a redirect.

## Definition of Done

- [ ] component test: a cache-hit revisit renders the cached summary with no loading state and no new fetch (AC-01)
- [ ] component test: a first load shows the loading indicator until the fetch resolves (AC-06)
- [ ] component test: a confirmed invalid-session response redirects to the correct sign-in URL and shows no dashboard data (AC-03), distinct from a connectivity/server failure
- [ ] lint + vet clean

## Notes

Shares `DashboardContainer.tsx` with T4/T5/T6 (files_hint overlap) — serialize in the same lane.
