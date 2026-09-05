---
status: Accepted
owner: "Tech Lead"
reviewers: ["Tech Lead", "Security Lead"]
updated_at: "2026-09-06"
feature_size: "M"
ticket: "dashboard-countries-list"
---

# 0006 — Store the catalogue reference as a validated text column

- **Status:** Accepted
- **Date:** 2026-09-06
- **Deciders:** Tech Lead (during the `design` Socratic walk)

## Context

A tracked destination names one entry of the destination catalogue — five entries this pass (Schengen, Thailand, Vietnam, Malaysia, Indonesia), each a permanent reference plus a display name, defined in the codebase. Two acceptance criteria pull in opposite directions on how the record references that catalogue. AC-02 requires the system to refuse any unsupported reference however the request arrives, not merely whatever the picker offers. AC-09 requires a reference to be permanent, never reused and never removed once any Traveler could hold it, so a destination the app stops offering stays fully openable and removable and is simply no longer addable.

## Decision drivers

- Spec §5 AC-02: refusal of an unsupported reference is a guarantee for every request, not a UI affordance.
- Spec §5 AC-09: references are permanent and never reused; delisting must not break a stored record.
- Spec §3: visa regimes and durations are deliberately not shipped, and "data that ships unused also ships unreviewed".
- Spec §8: whether the catalogue leaves the codebase is an open question owned by PM, due before the day-count feature — so this pass should not pre-empt it.
- SAD §2: Drizzle ORM only, one migration per schema change, forward and down.

## Considered options

1. **A text column validated in the app layer** against a frozen in-code catalogue.
2. **A catalogue table with a foreign key** from `tracked_destinations`, seeded by migration.
3. **A Postgres enum column** holding the five references.

## Decision outcome

**Chosen:** Option 1. Delisting is the operation AC-09 makes delicate, and with a text column it is simply removing an entry from the addable set while every stored reference keeps resolving — no schema change, no orphan, no relabelling. Option 2 would make AC-02 structurally unviolatable, which is genuinely attractive, but AC-09 forbids ever deleting a catalogue row, so it would need an `is_addable` flag regardless, and it ships a table for five constants that nothing else reads — precisely what spec §3 argues against. Option 3 makes delisting a migration on a type, which Postgres makes awkward, for the same benefit as Option 2 and less flexibility.

## Consequences

**Positive**
- Delisting a destination is an edit to a constant; every stored record keeps resolving under the name it was created with.
- No table, no seed migration and no join for data that is five compile-time constants.
- Leaves spec §8's "move the catalogue out of the codebase" genuinely open rather than half-answered.

**Negative**
- AC-02 is enforced by application code, so an unvalidated write path would corrupt data that the database would otherwise have rejected. It is covered by an explicit test at the app-layer boundary (§10 QG-1) rather than by structure.
- A reference typo in a future migration or seed script would not be caught by the database.

**Neutral**
- Moving to Option 2 later is a table, a backfill and an FK addition — real work, but the stored values are already the natural key it would use.

## Links

- Spec: [[../spec.md]] §3, §5 AC-02, AC-09, §8
- SAD: [[../sad.md]] §5, §8, §10 QG-1
- Related ADR: [[0005-confirm-writes-server-side-then-splice-the-confirmed-record-into-the-cache]]
