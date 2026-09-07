---
status: Accepted
owner: "Tech Lead"
reviewers: ["Tech Lead"]
updated_at: "2026-09-06"
feature_size: "M"
ticket: "dashboard-countries-list"
---

# 0005 — Confirm writes server-side, then splice the confirmed record into the cache

- **Status:** Accepted
- **Date:** 2026-09-06
- **Deciders:** Tech Lead (during the `design` Socratic walk)

## Context

Spec §1 decides that the list reflects only confirmed changes: an add or a removal appears once the system has recorded it and never optimistically ahead of confirmation. That rules out TanStack Query's usual optimistic-update idiom and makes the interval between the server's answer and the list changing a real design question. Spec §6 budgets 800 ms from the Traveler's action to the list reflecting the confirmed result, so the number of round trips inside that interval matters.

## Decision drivers

- Spec §1 and §5 AC-01/AC-08: nothing appears or disappears from the list before the system confirms it.
- Spec §5 AC-17: when a removal cannot be completed the record stays exactly as it was, with no ambiguous wording.
- Spec §6: 800 ms from action to the **confirmed** list state.
- Spec §5 AC-03: records appear in the order the system recorded them, most recent last, with each record's own identifier settling ties.
- SAD §1 quality goal 3: truthfulness of displayed state.

## Considered options

1. **The mutation returns the affected record; `onSuccess` splices it into the cache** via `setQueryData`.
2. **The mutation returns success only; `onSuccess` invalidates the list query** and the list is re-read from the server.
3. **The mutation returns the Traveler's whole list** in its new state, replacing the cache wholesale.

## Decision outcome

**Chosen:** Option 1. One round trip leaves real headroom inside the 800 ms budget while the cache still only ever holds confirmed state, and a failed mutation touches the cache not at all, which is what AC-17 needs. Option 2 keeps the server as the single authority on ordering but spends two sequential round trips inside one budget. Option 3 was rejected because it returns up to 500 records — §6's operable ceiling — on every write, and gives the `api` stage an unusual shape to model.

## Consequences

**Positive**
- The cache never holds an unconfirmed record, so AC-01, AC-08 and AC-17 hold by construction rather than by discipline.
- One round trip per write; the 800 ms budget is not spent on a refetch.
- A failed write leaves the cache untouched, so the list is correct without a rollback path.

**Negative**
- The ordering rule (recorded order, most recent last, identifier as tie-break) exists in two places — the server's read query and the client's splice — and they can drift.
- Any server-side change to how a record is shaped on read must be mirrored in what the create endpoint returns.

**Neutral**
- The ordering rule is stated once in SAD §8 so both implementations cite the same source; a future move to Option 2 would remove the client copy.

## Links

- Spec: [[../spec.md]] §1, §5 AC-01, AC-03, AC-08, AC-17, §6
- SAD: [[../sad.md]] §4, §8, §10 QG-3
- Related ADR: [[0001-serve-tracked-destinations-over-an-http-api-consumed-by-tanstack-query]]
