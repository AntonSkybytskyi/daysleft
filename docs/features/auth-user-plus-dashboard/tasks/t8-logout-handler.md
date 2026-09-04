---
id: T8
title: "Implement the logout route handler (POST /api/v1/auth/logout)"
layer: "ports"
deps: ["T6"]
acs: ["AC-06"]
files_hint: ["src/modules/auth/app/logout.ts", "src/app/api/v1/auth/logout/route.ts"]
owner: "Backend Lead"
estimate: "S"
status: "todo"
---

# T8 — Implement the logout route handler (POST /api/v1/auth/logout)

## Why

Implements [openapi.yaml `logout`](../contracts/openapi.yaml) and [sad.md §6 flow 7](../sad.md): [AC-06](../spec.md) requires the session to end server-side, not just a client cookie clear.

## What

Route handler: verify the current session via T6; if valid, call the Clerk SDK to revoke it server-side and return 204; if no active session exists, return 401 `auth.session_invalid`.

## Definition of Done

- [ ] integration test: logging out a valid session returns 204 and revokes it server-side (verified via the Clerk SDK/test double, not just a client-cookie assertion)
- [ ] integration test: a subsequent dashboard request (T7) on the same session returns 401 after logout
- [ ] integration test: logging out with no active session returns 401 `auth.session_invalid`
- [ ] lint + vet clean

## Notes

Shares no files with T7 — parallel-safe, both depend only on T6.
