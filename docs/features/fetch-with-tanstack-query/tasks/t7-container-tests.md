---
id: T7
title: "Test DashboardContainer/DashboardScreen against AC-01/02/03/04/06"
layer: "tests"
deps: ["T3", "T4", "T5"]
acs: ["AC-01", "AC-02", "AC-03", "AC-04", "AC-06"]
files_hint: ["src/modules/dashboard/ui/DashboardContainer.test.tsx", "src/modules/dashboard/ui/DashboardScreen.test.tsx"]
owner: "Frontend Lead"
estimate: "M"
status: "todo"
---

# T7 — Test DashboardContainer/DashboardScreen against AC-01/02/03/04/06

## Why

Closes out [spec §5](../spec.md)'s UI-facing acceptance criteria with the repo's existing colocated-Vitest convention ([CLAUDE.md](/CLAUDE.md)); pins the exact fetch-call-count behavior T3/T4/T5 implement.

## What

Extend `DashboardContainer.test.tsx` and `DashboardScreen.test.tsx` (existing files, per the repo's `vi.stubGlobal("fetch", ...)` convention — no MSW) to cover: dedup call-count pinning across a repeat mount/focus (AC-01), the retry-control path with no automatic retry (AC-02), the invalid-session-vs-connectivity-error split (AC-03), confirmation persistence across a retry (AC-04), and the loading indicator on first load and on retry (AC-06).

## Definition of Done

- [ ] all listed scenarios pass
- [ ] a test explicitly pins the dashboard fetch to exactly one call per scenario where AC-01 applies (closing the regression gap ADR-0001 flagged)
- [ ] lint + vet clean

## Notes

Depends on T3, T4, T5 landing first (tests the behavior they implement).
