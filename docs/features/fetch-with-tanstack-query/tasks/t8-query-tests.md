---
id: T8
title: "Test dashboard-query cache config, identity scoping, and logout clear"
layer: "tests"
deps: ["T2", "T6"]
acs: ["AC-05"]
files_hint: ["src/modules/dashboard/app/dashboard-query.test.ts"]
owner: "Frontend Lead"
estimate: "S"
status: "todo"
---

# T8 — Test dashboard-query cache config, identity scoping, and logout clear

## Why

Closes out [spec §5 AC-05](../spec.md) and [spec §6](../spec.md)'s "Cache retention" / "One-time flag integrity" NFR rows for the query-definition layer T2/T6 implement.

## What

`dashboard-query.test.ts`: unit tests for the conservative option set (T2), the identity-scoped key function (T2), the retention rule (no eviction before sign-out/page unload), and the logout-clear helper (T6).

## Definition of Done

- [ ] all listed scenarios pass
- [ ] lint + vet clean

## Notes

Depends on T2 and T6 landing first.
