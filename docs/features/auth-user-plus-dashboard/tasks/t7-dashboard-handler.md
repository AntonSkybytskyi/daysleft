---
id: T7
title: "Implement the dashboard route handler (GET /api/v1/dashboard)"
layer: "ports"
deps: ["T6"]
acs: ["AC-05", "AC-07"]
files_hint: ["src/modules/dashboard/app/get-dashboard.ts", "src/app/api/v1/dashboard/route.ts"]
owner: "Backend Lead"
estimate: "S"
status: "todo"
---

# T7 — Implement the dashboard route handler (GET /api/v1/dashboard)

## Why

Implements [openapi.yaml `getDashboard`](../contracts/openapi.yaml) and [sad.md §6 flows 1/6](../sad.md): the session-gated dashboard data fetch, shipping the empty-state shell per [AC-07](../spec.md).

## What

Route handler: call T6's session helper; on valid session, return 200 `DashboardData` with `has_trips: false` (hardcoded, per [data-model.md](../data-model.md) — no `trips` table yet); on no/expired/invalid session, return 401 `auth.session_invalid` with `details.return_to` set to the originally requested path, revealing no account or dashboard data.

## Definition of Done

- [ ] integration test: valid session returns 200 with `has_trips: false` and the correct `user` summary
- [ ] integration test: no session returns 401 `auth.session_invalid` with `details.return_to` populated and no user/dashboard fields present
- [ ] integration test: expired/invalid session behaves identically to no session (AC-05: reveals nothing)
- [ ] lint + vet clean
