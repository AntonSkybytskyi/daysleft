---
status: Accepted
owner: "Tech Lead"
reviewers: ["Tech Lead"]
updated_at: "2026-09-06"
feature_size: "M"
ticket: "dashboard-countries-list"
---

# 0004 — Build one in-repo Modal primitive for all three overlay surfaces

- **Status:** Accepted
- **Date:** 2026-09-06
- **Deciders:** Tech Lead (during the `design` Socratic walk)

## Context

This feature opens three surfaces over the content — the narrow-screen list drawer, the add picker and the removal confirmation — and spec §5 AC-12 puts one identical focus contract on all three: opening moves keyboard focus into the surface, closing returns focus to the control that opened it, and Escape closes it. `src/modules/ui/` holds eight primitives and none of them is an overlay; the repository has no headless-UI, Radix or similar dependency, and `docs/design-system.md` records the design tool as `code` with the in-repo components as the library.

## Decision drivers

- Spec §5 AC-12: the focus-in, focus-return and Escape contract, identical across all three surfaces.
- Spec §6 NFR: zero accessibility violations at serious or critical severity on the list, the picker and the removal confirmation, **plus component-test assertions on focus movement for all three**.
- SAD §1 quality goal 2: keyboard operability of the overlay surfaces is a top-3 quality goal.
- SAD §2 Constraints: jsdom 30.0.1 in this repository does not implement `HTMLDialogElement.showModal` (verified by probe), so anything relying on it is untestable at the component level here.
- `docs/design-system.md`: tool `code`; the in-repo `src/modules/ui/` components are the library, and every existing primitive is dependency-free.

## Considered options

1. **A hand-rolled `src/modules/ui/Modal`** — focus trap, focus restore, Escape handling and `aria-modal` written in-repo, matching the existing dependency-free primitives.
2. **A Radix headless dialog wrapped once as `Modal`** — `@radix-ui/react-dialog` supplies focus trapping, restoration, Escape and background inerting; Tailwind still does all styling.
3. **Native `<dialog>` with `showModal`, plus a polyfill for tests** — the browser provides the behaviour in production.

## Decision outcome

**Chosen:** Option 1. It keeps the primitive library dependency-free and consistent with the design canon as written, and because the behaviour is our own code it is directly assertable in jsdom, which is what §6's focus assertions require. Option 3 was excluded on evidence: with no `showModal` in this jsdom, every focus assertion would exercise a polyfill rather than shipped behaviour, which is exactly the guarantee those assertions exist to buy. Option 2 was the safer route to correctness and was declined in favour of keeping the canon and the dependency surface intact; the resulting risk is accepted explicitly in SAD §11 rather than left implicit.

## Consequences

**Positive**
- The focus contract is written once and inherited by all three surfaces, so they cannot drift apart.
- No new dependency and no amendment to `docs/design-system.md`.
- The primitive is directly testable under jsdom, so §6's focus assertions test what ships.

**Negative**
- Focus trapping is subtle, and the classic defects — shift-tab wrapping at the first focusable element, restoring focus to a control that has since unmounted, ordering when a surface opens over another — are ours to get right. Tracked as accepted risk in SAD §11.
- The automated accessibility check becomes load-bearing rather than a formality, since it is the main independent evidence that the hand-rolled behaviour is correct.

**Neutral**
- Swapping to a headless library later is contained: three surfaces consume one primitive, so the change is behind `Modal`'s own interface.

## Links

- Spec: [[../spec.md]] §5 AC-12, §6 NFR (accessibility)
- SAD: [[../sad.md]] §4, §5, §10 QG-2, §11
- Related ADR: —
