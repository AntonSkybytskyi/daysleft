---
id: T9
title: "Add GET/POST /api/v1/destinations route handlers"
layer: "ports"
deps: ["T5", "T6"]
acs: ["AC-01", "AC-02", "AC-03", "AC-07", "AC-11", "AC-13"]
files_hint: ["src/app/api/v1/destinations/route.ts"]
owner: "Tech Lead"
estimate: "M"
status: "todo"
---

# T9 — Add GET/POST /api/v1/destinations route handlers

## Why

Serves the list and accepts a create, over the unified error envelope
([contracts/openapi.yaml](../contracts/openapi.yaml) `/api/v1/destinations`; [sad.md §8](../sad.md)
"Error handling").

## What

Add `route.ts` with `GET` (calls T5, maps its result to `200`/`401`/`500` per the contract) and
`POST` (calls T6, maps to `201`/`401`/`422`). Auth via the injected `getAuthUserId` dependency
([sad.md §8](../sad.md) "Authentication") — never a client-supplied identity.

## Definition of Done

- [ ] route tests assert `GET` returns `200` with the ordered list for a signed-in caller and
      `401` revealing nothing for no valid sign-in
- [ ] route tests assert `POST` returns `201` with the recorded record, `422
      destinations.unsupported_reference` for an unsupported reference, `401` unauthenticated
- [ ] every response shape matches `contracts/openapi.yaml` schemas exactly
- [ ] lint + vet clean

## Notes

Not yet reachable — T11 adds this path to the middleware allowlist. AC-04 (add action placement)
has no runtime branch here per `sad.md §6`; it is a UI affordance covered by T15/T16.
