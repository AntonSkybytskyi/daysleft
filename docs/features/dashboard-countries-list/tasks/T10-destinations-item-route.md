---
id: T10
title: "Add GET/DELETE /api/v1/destinations/{trackedDestinationId} route handlers"
layer: "ports"
deps: ["T7", "T8"]
acs: ["AC-05", "AC-06", "AC-08", "AC-14", "AC-16", "AC-17"]
files_hint: ["src/app/api/v1/destinations/[trackedDestinationId]/route.ts"]
owner: "Tech Lead"
estimate: "M"
status: "todo"
---

# T10 — Add GET/DELETE /api/v1/destinations/{trackedDestinationId} route handlers

## Why

Resolves a saved address and removes a record, both through the ownership-scoped path
([contracts/openapi.yaml](../contracts/openapi.yaml)
`/api/v1/destinations/{trackedDestinationId}`; ADR-0008).

## What

Add `route.ts` with `GET` (calls T8, maps to `200`/`401`/`404`) and `DELETE` (calls T7, maps to
`204`/`401`/`404`/`500`). A confirmed invalid sign-in on `DELETE` takes precedence over every
other outcome (AC-14; `sad.md §8` "Error precedence").

## Definition of Done

- [ ] route tests assert `GET` returns `200` for the owner and `404 destinations.not_found`
      identically for another owner's/removed/never-existed ids
- [ ] route tests assert `DELETE` returns `204` on confirmed removal, `404` the same way as `GET`,
      `401` taking precedence when the sign-in is confirmed invalid (checked before the not-found
      case), and `500` on an incomplete removal without deleting the row
- [ ] every response shape matches `contracts/openapi.yaml` schemas exactly
- [ ] lint + vet clean

## Notes

Not yet reachable — T11 adds this path to the middleware allowlist.
