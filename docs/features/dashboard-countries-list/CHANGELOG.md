# Changelog — dashboard-countries-list

## dashboard-countries-list — track countries you want to visit, right from the dashboard

**What:** Signed-in travelers can now add countries from a fixed five-entry catalogue to a
personal tracked-destinations list, open a destination's own page, and remove it — from both the
dashboard home and a narrow-screen drawer reachable via a toggle in the app shell's header nav
slot.

**Why:** The dashboard previously had nowhere to record which countries a traveler cares about.
See [spec](../spec.md) §1/§2 for the problem framing. Key decisions: writes are confirmed
server-side before they land in the client cache, never optimistic
([ADR-0005](../adr/0005-confirm-writes-server-side-then-splice-the-confirmed-record-into-the-cache.md));
sign-out clears the whole query cache rather than one named key
([ADR-0007](../adr/0007-clear-the-whole-query-cache-on-a-confirmed-sign-out.md)); a destination not
yours, removed, or never existing all answer identically to avoid leaking existence
([ADR-0008](../adr/0008-answer-not-yours-removed-and-never-existed-identically.md)); ids are
UUIDv7 generated app-side ([ADR-0009](../adr/0009-generate-uuidv7-identifiers-app-side-in-a-shared-helper.md)).

**How to use:** `GET/POST /api/v1/destinations` lists/adds a tracked destination for the signed-in
user; `GET/DELETE /api/v1/destinations/{trackedDestinationId}` reads/removes one. See
[openapi.yaml](../contracts/openapi.yaml) for the full contract, including the unified
`{ error: { code, message } }` envelope on every failure path.

**Operational notes:**
- Migration: `drizzle/0002_new_scarlet_witch.sql` (adds `tracked_destinations`) — applied on
  deploy via the normal migration step; `0002_new_scarlet_witch.down.sql` reverts it cleanly.
- Feature flag / config: none — ships enabled for all signed-in users.
- Rollback: revert the deploy, then `drizzle-kit` down-migrate `0002_new_scarlet_witch`.

**Acceptance criteria delivered:** AC-01 through AC-17 (add/remove/list/open a destination, the
not-available and removed-elsewhere states, session-invalid routing on read and write, the
narrow-screen drawer + header toggle, and the malformed-request/authorization edge cases) — see
[spec](../spec.md) §5 for the full table.
