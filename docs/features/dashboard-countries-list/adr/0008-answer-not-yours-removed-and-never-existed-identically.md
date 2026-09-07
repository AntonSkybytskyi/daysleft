---
status: Accepted
owner: "Tech Lead"
reviewers: ["Tech Lead", "Security Lead"]
updated_at: "2026-09-06"
feature_size: "M"
ticket: "dashboard-countries-list"
---

# 0008 — Answer not-yours, removed and never-existed identically

- **Status:** Accepted
- **Date:** 2026-09-06
- **Deciders:** Tech Lead (during the `design` Socratic walk)

## Context

A tracked destination's identifier appears in its address, which a Traveler can bookmark, reload and share. Spec §6.1 names enumeration through a saved address as an abuse case: an unowned or invented identifier can be probed. Spec §5 AC-06 answers it by requiring that another Traveler's record, one this Traveler removed, and one that never existed all produce the same outcome by the same handling path, with no early rejection based on the shape of the identifier and no difference in what the Traveler sees. The same property must hold for every path that resolves an identifier — reading a destination by its saved address and removing one — so both go through the same server-side lookup rather than one being answered on the client.

## Decision drivers

- Spec §5 AC-06: one path, one message, no early rejection by identifier shape; the system never reveals whether a destination exists or belongs to someone else.
- Spec §6.1, enumeration through a saved address, and the required security review.
- Spec §5 AC-17: a removal that did not happen must never read as one that did.
- SAD §1 quality goal 1: confidentiality of a Traveler's tracked set.

## Considered options

1. **A single `404` carrying `destinations.not_found`** for every miss on every path, produced by one ownership-scoped lookup shared by the by-identifier read and the removal.
2. **`204 No Content` regardless** — treat removal as idempotent, since absent is absent.
3. **`403` for not-yours and `404` for never-existed** — the conventional HTTP distinction.

## Decision outcome

**Chosen:** Option 1. The handler asks one question — does a record with this identifier exist *and belong to the caller* — so a miss is a miss for all three reasons, and there is no shape check, format validation or existence probe that could reject earlier or differently. Because the lookup is ownership-scoped, all three cases return zero rows from the same query executing the same plan, so the indistinguishability is a property of the query rather than of matching two code branches by hand. Option 3 is the exact oracle §6.1 describes: the pair of status codes tells a prober which identifiers are real. Option 2 leaks nothing but lets an action that changed nothing report success, which is the failure mode AC-17 and AC-14 are both written to prevent.

## Consequences

**Positive**
- Probing an identifier yields no signal: same status, same code, same message, same path, whatever the reason.
- A malformed identifier takes the same route as a well-formed unowned one, so there is no fast-fail to time.
- One error code for the `api` stage to model, and one string for the Traveler.

**Negative**
- `404` for a record that demonstrably exists is semantically imprecise, and a future reader may try to "fix" it to `403`. The reason is recorded here for exactly that reason.
- Debugging is slightly harder: an operator cannot tell from the response which of the three cases occurred.

**Neutral**
- Reads and removals share one mechanism (§6 flow 2), so the guarantee is asserted once against the by-identifier endpoint and holds for both. An earlier draft resolved the address on the client against the Traveler's own list, which avoided having a by-identifier endpoint at all; that was traded for a single verifiable path, and the residual exposure is recorded in SAD §11 as Low.

## Links

- Spec: [[../spec.md]] §5 AC-06, AC-17, §6.1 (enumeration through a saved address)
- SAD: [[../sad.md]] §6 flow 2, §8, §10 QG-1
- Related ADR: [[0002-address-an-open-tracked-destination-as-a-path-segment-under-dashboard]]
