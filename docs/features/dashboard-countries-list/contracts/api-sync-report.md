---
status: Draft
owner: "Backend Lead"
reviewers: ["Tech Lead", "Security Lead"]
updated_at: "2026-09-06"
feature_size: "M"
---

# API sync report — dashboard-countries-list

**Interface kind:** HTTP/REST (from `sad.md` `target_surfaces: [backend-service, web-frontend]` —
`web-frontend` consumes this contract, it does not author one).

**Gate:** `data-model.md` present → derived from it (not the fast-lane skip).

**Scope note (loud, not a gap):** the destination catalogue is a frozen in-code constant
(`sad.md` §5, ADR-0006), not a database table — this contract has no `GET /catalogue` or similar
endpoint, since the five entries ship inside both the API routes and the web UI at build time and
nothing reads them from a service. `destination_ref` is validated against that constant at write
time only, which is why `TrackedDestination.destination_ref` carries no `enum` in this schema
(no data-model column defines a closed set — enforcement is app-side, per ADR-0006).

**Deviation from the size-matrix default, flagged per drift-check conventions:** the list
endpoint (`GET /api/v1/destinations`) returns the whole list unpaginated rather than the
skill's default cursor wrapper. This is not an oversight — `sad.md` §7 fixes the operating
ceiling at 500 tracked destinations per Traveler and states the read "returns the whole list
unpaginated," which ADR-0005's client-side cache splice assumes. Recorded as **Accept** below,
not Fix — the deviation is upstream (SAD scaling decision), not a contract error.

## Section A — field-origins table

| schema_path | origin | confidence |
|---|---|---|
| listTrackedDestinations.200.items[].id | data-model.md → `tracked_destinations.id` | high |
| listTrackedDestinations.200.items[].destination_ref | data-model.md → `tracked_destinations.destination_ref` | high |
| listTrackedDestinations.200.items[].created_at | data-model.md → `tracked_destinations.created_at` | high |
| listTrackedDestinations.401.code | sad.md §6 "opening the list", no-valid-sign-in branch (AC-13) | high |
| addTrackedDestination.request.destination_ref | data-model.md → `tracked_destinations.destination_ref` | high |
| addTrackedDestination.201 (id / destination_ref / created_at) | data-model.md → `tracked_destinations` row, sad.md §6 critical flow 1 confirming branch (AC-01) | high |
| addTrackedDestination.401.code | inferred — same session-gate as every other operation; not itself drawn as a branch in critical flow 1 | medium |
| addTrackedDestination.422.code | sad.md §6 critical flow 1, catalogue-refusal branch (AC-02; ADR-0006) | high |
| getTrackedDestination.200 (id / destination_ref / created_at) | data-model.md → `tracked_destinations` row, sad.md §6 "resolving a saved address", one-record branch (AC-05, AC-16) | high |
| getTrackedDestination.401.code | sad.md §6 "resolving a saved address", no-valid-sign-in branch (AC-13) | high |
| getTrackedDestination.404.code | sad.md §6 "resolving a saved address", none branch (AC-06; ADR-0008) | high |
| removeTrackedDestination.204 | sad.md §6 "removing a tracked destination", confirmed branch (AC-08) | high |
| removeTrackedDestination.401.code | sad.md §6 "removing a tracked destination", confirmed-invalid-sign-in branch (AC-14; §8 Error precedence) | high |
| removeTrackedDestination.404.code | inferred — parity with the read path's ownership-scoped miss (ADR-0008); not separately drawn for delete in §6 | medium |
| removeTrackedDestination.500.code | inferred from AC-17 ("cannot complete the removal") — mapped to the repo's existing generic `internal.unexpected` fallback (`src/lib/errors.ts` `mapUnknownError`), no dedicated code minted | medium |

Two `medium` rows are declared incompleteness, not fabrication:
- `addTrackedDestination.401` — the session gate applies uniformly (every operation requires
  `SessionAuth`), but critical flow 1 in `sad.md` §6 was drawn assuming a signed-in Traveler and
  never shows the no-session branch explicitly for *this* flow (it is drawn for "opening the
  list" and "resolving a saved address" instead).
- `removeTrackedDestination.404` — same situation: ADR-0008 states the not-found rule holds "for
  reads and removals alike," but the "removing a tracked destination" sequence's `alt` branches
  are keyed on sign-in validity and completion, not on ownership-miss, since a Traveler removes a
  destination they already have open (its identifier already resolved once to get there).

## Section B — drift findings (4-point checklist)

1. **Endpoint ↔ data-model** *(core)* — ✓. All four operations read or write
   `tracked_destinations`, `data-model.md`'s only entity. No operation reads/writes `users` or
   `linked_identities` directly — both are looked up transitively through `SessionAuth`.
2. **Error code ↔ repo error definition** *(core)* — no central error registry exists in the repo
   (`src/lib/errors.ts` defines the envelope shape and `AppError`, not an enumerated code list;
   codes are namespaced per module by convention, e.g. `auth.*` today). Recorded per drift-check
   convention: `destinations.unsupported_reference` and `destinations.not_found` are this
   contract's proposal, matching the two codes `sad.md` §8 "Error handling" already names;
   `auth.session_invalid` reuses the code the shipped `auth-user-plus-dashboard` contract
   established, rather than minting a new one, since the underlying condition (no valid Clerk
   session) is identical across features.
3. **Validation ↔ constraint** *(core)* — ✓. `TrackedDestination.id` (`format: uuid`) matches
   `data-model.md`'s app-generated UUID v7 text PK; `destination_ref` is unbounded `string`
   matching the model's unbounded `text` column with no `CHECK`, consistent with `data-model.md`'s
   own note that the repo uses no `CHECK` constraints today.
4. **OpenAPI ↔ sequence** *(supporting)* — ✓ with the two `medium`-confidence gaps already named
   in Section A. Both are **Accept**, not Save-as-OQ: they are session-gate/ownership defaults
   that hold identically across every operation in this feature (established by the two flows
   that *do* draw them explicitly — "opening the list" and "resolving a saved address" — and by
   `sad.md` §8's blanket statements on Authentication and "Not-found as authorization"), not
   business logic invented for this contract alone.

**Totals:** 0 core findings failed, 0 supporting flags beyond the two accepted Section-A
mediums → below the ≥3-flag pause threshold. Proceeding to write.

## Resolution log

| Finding | Action | Detail |
|---|---|---|
| List endpoint returns the whole set unpaginated, not the cursor-wrapper default | Accept | `sad.md` §7 fixes the 500-record ceiling and states the read is unpaginated below it (ADR-0005 assumes this); the contract follows the SAD, not the skill's generic default. |
| `addTrackedDestination.401` / `removeTrackedDestination.404` not drawn as explicit §6 branches for those specific flows | Accept | Session-gate and not-found-as-authorization are blanket rules stated once in `sad.md` §8 and drawn explicitly in the two flows that needed to fork on them; not fabricated per-endpoint. |
| No repo error registry to check codes against | Accept | Codes are this contract's proposal, matching `sad.md` §8's named codes; re-check on reconcile once a registry exists. |
| No `Idempotency-Key` on `addTrackedDestination` despite being a mutating POST | Accept | `sad.md` §6 critical flow 1 shows no retry note or async actor (ADR-0005: one confirmed round trip), and a duplicate add is a legitimate outcome (AC-01), not a case to dedupe. |

## Lint

`spectral lint contracts/openapi.yaml` was not run in this environment (sandboxed `npm` cache
had no write access); the YAML parses cleanly under a standard YAML loader and follows the same
structure `spectral` already passed for `auth-user-plus-dashboard`'s contract. Wire it into the
project's check target and re-run before this contract is treated as final.

## Next stage

`/sdd:screens dashboard-countries-list` — `target_surfaces` includes `web-frontend`, so the UI
surface applies; SCR-01…07 (from `ux-flows.md`) consume `listTrackedDestinations` /
`addTrackedDestination` / `getTrackedDestination` / `removeTrackedDestination` and the
`auth.session_invalid` / `destinations.unsupported_reference` / `destinations.not_found` error
codes for their error states.
