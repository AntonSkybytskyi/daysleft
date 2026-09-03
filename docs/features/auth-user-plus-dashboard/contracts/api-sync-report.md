---
status: Draft
owner: "Backend Lead"
reviewers: ["Tech Lead", "Security Lead"]
updated_at: "2026-09-03"
feature_size: "L"
---

# API sync report — auth-user-plus-dashboard

**Interface kind:** HTTP/REST (from `sad.md` `target_surfaces: [backend-service, web-frontend]` —
`web-frontend` consumes this contract, it does not author one). No gRPC/CLI/library/event-only
form applies.

**Gate:** `data-model.md` present → derived from it (not the fast-lane skip).

**Scope note (loud, not a gap):** OAuth/magic-link *initiation* and consent are handled entirely
by Clerk's hosted UI — the sequences (`sad.md` §6 flows 1–5) show `Web UI → Clerk` directly for
those steps, never through `API routes`. This backend therefore has **no** endpoint for "start
sign-in" or "send magic-link" — inventing one would have no origin in any input. The two
operations this backend does own are the account-sync webhook (flows 1, 3, 4) and the
session-gated dashboard/logout surface (flows 1, 6, 7). US-07 (i18n) maps to no endpoint, same as
`sad.md` §6 marked it non-runtime — client-side render, not a service call.

## Section A — field-origins table

| schema_path | origin | confidence |
|---|---|---|
| handleClerkWebhook.request.type | Clerk webhook payload (external system, ADR-0001) | high |
| handleClerkWebhook.request.data.id | Clerk webhook payload → becomes `data-model.md` `users.id` | high |
| handleClerkWebhook.request.data.email_addresses[].email_address | Clerk webhook payload → becomes `data-model.md` `users.email` | high |
| handleClerkWebhook.request.data.email_addresses[].verification.status | Clerk webhook payload — gates the `auth.email_required` 422 (spec AC-03b) | high |
| handleClerkWebhook.200.id / .email / .created_at / .updated_at | data-model.md → `users.id` / `users.email` / `users.created_at` / `users.updated_at` | high |
| handleClerkWebhook.422.code | derived — neutral convention, sad.md §6 flow 4 (account-linking blocked branch) | high |
| handleClerkWebhook.401.code | infra-level (Svix signature check) — not a business alt-branch in any §6 flow | medium |
| getDashboard.200.user.id / .user.email | data-model.md → `users.id` / `users.email` | high |
| getDashboard.200.has_trips | spec §3 non-goal + AC-07 — hardcoded `false`, no `trips` table exists yet | medium |
| getDashboard.401.code | sad.md §6 flows 6/7 `alt` branches (no session / expired / invalid) | high |
| getDashboard.401.details.return_to | spec AC-04, sad.md §6 flow 6 ("return-to = originally requested page") | high |
| logout.204 | sad.md §6 flow 7 (server-side session revoke, AC-06) | high |
| logout.401.code | inferred — no active session to end; not drawn as a distinct §6 branch | low |

A `low` row (`logout.401.code`) is declared incompleteness: `sad.md` never draws "logout with no
session" as its own branch. Accepted as a reasonable defensive response, not fabricated business
logic — flagged rather than silently added.

## Section B — drift findings (4-point checklist)

1. **Endpoint ↔ data-model** *(core)* — ✓. `handleClerkWebhook` and `getDashboard` both read/write
   `users` (`data-model.md`'s only entity). `logout` reads no entity directly (it calls Clerk's
   Backend API to revoke a session, sad.md §4 ADR-0001) — accepted, since Clerk (not our Postgres)
   is the session system of record; nothing to trace to a column.
2. **Error code ↔ repo error definition** *(core)* — no error registry found yet (greenfield,
   `architecture-map.md` mode: `greenfield-bootstrap`, zero code exists). Recorded per drift-check
   convention: codes (`auth.email_required`, `auth.session_invalid`,
   `auth.webhook_invalid_signature`) are this contract's proposal; reconcile once the repo defines
   an error registry.
3. **Validation ↔ constraint** *(core)* — ✓. `User.email` (`format: email`) matches
   `data-model.md` `users.email` (`TEXT NOT NULL UNIQUE`); no `maxLength` imposed since the model
   chose unbounded `TEXT` (confirmed with the user during `data-model`).
4. **OpenAPI ↔ sequence** *(supporting)* — ✓ with one flagged gap: `sad.md` §6's Clerk webhook
   flows (1, 3, 4) never modeled a signature-verification failure or a retry/dead-letter branch for
   the webhook (an inbound async external-system call) — the sequences skill's own async checklist
   (idempotency-key step, retry note, dead-letter branch) wasn't applied when those flows were
   drawn. **Save-as-OQ, owner: `sequences`, due: before `implement` builds the webhook handler** —
   `sad.md` §6 flows 1/3/4 should gain a retry note + dead-letter branch for the Clerk webhook.
   This contract proceeds using `svix-id` as the dedupe key in the interim (a reasonable webhook
   default, not blocking).

**Totals:** 0 core findings failed, 1 supporting flag (open question, not blocking) → below the
≥3-flag pause threshold. Proceeding to write.

## Resolution log

| Finding | Action | Detail |
|---|---|---|
| Webhook retry/dead-letter not modeled in sad.md §6 | Save-as-OQ | Owner: `sequences`, due: before `implement` builds `POST /webhooks/clerk` |
| No repo error registry to check codes against | Accept | Codes are this contract's proposal (greenfield); re-check on reconcile once one exists |
| `logout.401` not drawn as a §6 branch | Accept | Defensive default, noted `low` confidence in Section A rather than silently added as "derived" |

## Next stage

`/sdd:screens auth-user-plus-dashboard` — `target_surfaces` includes `web-frontend`, so the UI
surface applies; SCR-01…04 (from `ux-flows.md`) consume this contract's `getDashboard` / `logout`
operations and the `auth.session_invalid` / `auth.email_required` error codes for their error
states.
