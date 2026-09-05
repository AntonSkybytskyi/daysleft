---
status: Draft
owner: "Tech Lead"
reviewers: ["Tech Lead", "Security Lead"]
updated_at: "2026-09-05"
feature_size: "M"
depends_on: "app-shell (the header / logout / linked-account confirmation refactor, plus a header slot a page can place a navigation control into) — must ship first"
---

# Spec — dashboard-countries-list

> **Glossary:** [CONTEXT](/CONTEXT.md) (repo-root; this feature added "Tracked destination", "Destination catalogue", "Detail view", "First-run screen" and "Saved address")
> **Reference module / docs / channels used:** `src/modules/dashboard/ui/DashboardScreen.tsx`, `src/modules/dashboard/ui/DashboardContainer.tsx`, `src/modules/dashboard/app/get-dashboard.ts`, `src/app/api/v1/dashboard/route.ts`, `src/db/schema.ts`, `docs/architecture-map.md`, `docs/design-system.md`, `docs/features/auth-user-plus-dashboard/spec.md`, `docs/features/fetch-with-tanstack-query/spec.md`.

## 1. Context

A Traveler who signs up today lands on a dashboard whose entire body is a placeholder empty state reading "Nothing tracked yet." There is nowhere to say which destinations they actually care about — no Schengen, no Thailand, nothing — so the app cannot show them anything, and there is no object for trips, visa types or day-counts to attach to when those arrive. The Traveler this hurts is the ordinary one described in the glossary: someone tracking a handful of destinations at once and currently doing it in a spreadsheet or in their head.

The trigger is that the two features shipped so far deliberately stopped short of this. Sign-in, account-linking-by-email and logout work; the dashboard's data fetch is cached and has explicit loading and error states — but both left the dashboard body a placeholder because there was no domain object to render. Nothing else in the product can move until a Traveler can express which destinations they are tracking: trip entry needs somewhere to put a trip, and the rules engine needs to know which rule to run.

The committed approach is a **persistent tracked-destination list as the app's home and primary navigation**, where each record is a slot that later gains its visa type and dates without the screen being rebuilt. Competitive research across five products in this space (a country-days tracker, a stay-limit manager, a nomad day-counter, a Schengen-only tracker and a preset visa calculator) found that none of them treats the tracked set as an explicit, curated list the Traveler manages deliberately — in every case it is a by-product of entered trips or a single hardcoded rule — and the multi-perspective review scored this approach positively on business fit for owning exactly that gap; in its own words, it "owns unclaimed dual-regime-list gap". Read against this pass, the part being claimed now is the curated list itself: a Traveler deliberately says which destinations they track, and may track one destination more than once. The per-record visa type that completes the picture lands with the next feature (§3), so this pass takes the ground rather than the whole gap. Feasibility is confirmed on all three counts (technology, skills, time), each justified by an already-shipped feature in this repository. A priority score was deliberately **not** computed: the product is pre-launch, so reach is theoretical and a score would read as more precise than it is; the decision is carried in §8 with an owner.

Traceability and decisions taken during the interview and the clarify sweep:

- **Dependency — the app shell ships first.** The header, the logout action and the one-time "Signed in to your existing account" confirmation currently live inside the dashboard page. Moving them into an app-level shell is **a separate feature that must ship before this one**, split out deliberately after review flagged that folding a shell refactor into a navigation feature is how a shipped guarantee gets dropped unnoticed. This spec assumes that shell exists and says nothing about how logout or that confirmation behave (§3). It does place **one requirement** on the shell: the shell must offer a slot in its header where a page can put a navigation control, because that is where this feature's narrow-screen list toggle lives (§5 AC-12). Whoever specifies the shell reads this as an input.
- **This pass creates the destination catalogue.** It ships five entries — **Schengen, Thailand, Vietnam, Malaysia and Indonesia** — each with a display name and a permanent reference, and nothing else: no visa types, no durations (§3). Schengen is a zone of 29 states rather than a country, which is why the glossary term is "destination" and not "country".
- **Decision — the record names a destination only.** Adding creates a tracked destination naming one destination catalogue entry. The visa type (Thailand's DTV or extendable stamp, Vietnam's shorter stamp or longer eVisa) and the stay dates are chosen in the detail view, and both are a **separate, committed next feature** (§3). This reverses an earlier interview position that fixed the visa type at add time.
- **Decision — repeated records are legitimate.** A Traveler planning two Thailand visits in a year holds two Thailand records. There is deliberately **no uniqueness rule** on a Traveler's tracked destinations. This reverses an earlier interview position that allowed at most one record per destination and visa type.
- **Decision — removal is a hard delete.** An earlier interview position was a soft hide with a later archive; it was reversed to a permanent removal behind a confirm step. A browsable archive is a possible later feature, not a deferred obligation.
- **Decision — the list reflects only confirmed changes.** An add or a removal appears in the list once the system has recorded it, never optimistically ahead of confirmation (§5 AC-01, AC-08). This is what keeps AC-14's prohibition on actions that "appear to succeed" honest, and it makes §6's write budget a real end-to-end number.

## 2. Goals

- A Traveler can express which destinations they are tracking, and that set persists across sign-in sessions and across the devices they sign in on.
- The app gains a persistent home and primary navigation that the next features — visa type and dates, then day-counts — extend in place rather than replace.
- A Traveler with nothing tracked is given one obvious thing to do instead of an empty screen.
- A Traveler's tracked destinations are readable and changeable only by that Traveler, including through a shared or guessed address, and are forgotten on this device when they sign out.

## 3. Non-goals

- **The app shell itself — the header, the logout action, and the one-time linked-account confirmation** — reason: split into its own feature that ships first, so the guarantee that confirmation carries is proved on its own rather than inside this feature's diff. This spec assumes the shell and never restates its behaviour; it only requires the header slot named in §1.
- **Choosing a visa type, or entering stay dates** — reason: both are mandatory fields of the detail view and are the committed next feature; folding them in here would triple the scope and put unreviewed visa durations in front of Travelers.
- **Day-count arithmetic and the rules engine** (Schengen's rolling window, DTV and stamp extensions) — reason: it cannot run before types and dates exist, and each rule is subtle enough to deserve its own scrutiny.
- **Visa regimes and their durations in the destination catalogue** — reason: nothing in this pass reads them, and data that ships unused also ships unreviewed; they land with the feature that displays them.
- **Traveler-defined destinations beyond the five this pass ships** — reason: a destination the app knows nothing about can never be day-counted, and hand-typed names cannot be reconciled with real support later.
- **Any offline use of tracked destinations — reading the list as well as creating or removing one** — reason: the offline write path is the architecture's highest-risk piece and its conflict strategy is deliberately deferred to the sync feature's own decision record. This is a stated deviation from the project's offline-first baseline, not an oversight: with no network a Traveler sees a recoverable error (§5 AC-11) rather than their list, and §8 carries when that changes.
- **Reordering the list by hand (drag or move controls)** — reason: creation order is predictable and sufficient for a short list; reordering costs a stored position, a write path and an accessible alternative.
- **Analytics, telemetry, event tracking or production timing measurement** — reason: the app has none today, and choosing an analytics path for a product holding travel data is its own decision, not a rider on a UI feature. Every §6 target is therefore verified in the test suite, not in production.
- **An archive or undo for removed tracked destinations** — reason: removal is permanent by decision; an archive is a candidate later feature, and while a record holds only a destination name the cost of a mis-delete is three taps.
- **Promising future functionality in the product's own copy** — reason: the detail view says what is true now (nothing recorded yet) and makes no claim about what a later release adds, so no shipped string goes stale when priorities move.

## 4. User stories

### US-01: Add a tracked destination

**As a** Traveler
**I want** to add a destination from the ones the app supports to my list, whether it is my first or my fifth
**So that** the app knows which places I need to keep track of

### US-02: See my tracked destinations

**As a** Traveler
**I want** to see everything I am tracking in one persistent list
**So that** I can move between my destinations without hunting for them

### US-03: Open a tracked destination

**As a** Traveler
**I want** to open one of my tracked destinations and see its own view
**So that** I have a place that will hold that destination's visa type, dates and day-count

### US-04: Remove a tracked destination

**As a** Traveler
**I want** to remove a destination I added by mistake or no longer need
**So that** my list reflects only what I actually care about

### US-05: Start with nothing tracked

**As a** Traveler
**I want** a clear first screen when I have nothing tracked yet
**So that** my first session has one obvious thing to do instead of an empty page

### US-06: Use my list on a phone

**As a** Traveler
**I want** my tracked destinations to be reachable on a phone without the list eating the screen
**So that** I can use the app while actually travelling, not only at a desk

### US-07: Come back to where I was

**As a** Traveler
**I want** a reload to put me back on the destination I was looking at, and only ever on one of mine
**So that** refreshing or bookmarking does not throw away my place or show me someone else's

## 5. Acceptance criteria

### AC-01 (US-01) — happy path

**Given** a signed-in Traveler is looking at their tracked destinations
**When** the Traveler adds one of the destinations the app supports
**Then** the system records a new tracked destination for that Traveler and, once that is confirmed and not before, shows it in their list and opens its detail view — including when the Traveler already tracks that same destination, which is allowed and creates a separate record; on a narrow screen the list closes as it does when a destination is chosen, and focus moves to the newly opened detail view

### AC-02 (US-01) — error

**Given** any attempt to create a tracked destination naming something that is not one of the destinations the app supports, however that attempt reaches the system
**When** the system handles it
**Then** it refuses to create the tracked destination, records nothing, and reports in plain language that only the destinations the app supports can be tracked — the refusal is a guarantee the system upholds for every request, not only for what the picker allows a Traveler to choose

### AC-03 (US-02) — happy path

**Given** a signed-in Traveler has added several tracked destinations
**When** the Traveler looks at their list
**Then** the system shows every one of them in the order the system recorded them, most recent last, with each record's own permanent identifier settling any tie so two destinations added moments apart never swap places — and that order is the same on any device the Traveler signs in on

### AC-04 (US-01) — happy path

**Given** a signed-in Traveler who already tracks at least one destination
**When** the Traveler looks for a way to add another
**Then** an add action is available at the end of their list at every screen width — on a narrow screen that is inside the list once opened — and choosing it presents the destinations the app supports over the current view rather than navigating away, so the Traveler does not lose their place

### AC-05 (US-07) — happy path

**Given** a signed-in Traveler has one of their tracked destinations open
**When** the Traveler reloads the page, or returns later to the same saved address
**Then** the system opens that same tracked destination rather than resetting to the top of the list

### AC-06 (US-07) — authorization

**Given** a signed-in Traveler follows a saved address naming a tracked destination that is not theirs — another Traveler's, one they removed, or one that never existed
**When** the system handles that address
**Then** all three cases produce the same outcome by the same handling path, with no early rejection based on the shape of the identifier and no difference in what the Traveler sees: nothing is selected, the address is replaced with the plain home address so a reload does not repeat it, and one single message — "That destination isn't available." — is shown, identical in all three cases; the system never reveals whether the destination exists or belongs to someone else

### AC-07 (US-02) — happy path

**Given** a signed-in Traveler who tracks at least one destination but has no destination open — on first arrival without a saved address, after the system rejected an address under AC-06, or after removing the destination they had open
**When** the system shows their list
**Then** it selects nothing on the Traveler's behalf and the content area invites them to choose a destination from their list; on a narrow screen the list opens by itself so the choice is in front of them

### AC-08 (US-04) — happy path

**Given** a signed-in Traveler has a tracked destination open
**When** the Traveler removes it from that destination's own view and confirms, having been shown which destination is being removed in a confirmation the app itself presents
**Then** the system permanently removes that tracked destination and, once that is confirmed and not before, it disappears from the list and the Traveler is left in the no-selection state of AC-07 rather than on a dead view

### AC-09 (US-02) — domain invariant

**Given** a Traveler tracks a destination that the app has since stopped offering as an option to add
**When** the Traveler looks at their list or opens that tracked destination
**Then** the system still shows it under the destination it was created for and never relabels it as a different destination — a destination's reference is permanent, never reused for anything else and never removed once any Traveler could hold it, so a delisted destination stays fully openable and removable; it simply cannot be added again

### AC-10 (US-05) — happy path

**Given** a signed-in Traveler tracks nothing
**When** the Traveler opens the app
**Then** the system shows the first-run screen — a screen of its own with no list beside it — whose single action adds a first destination; adding one takes the Traveler into the normal list view with that destination open, and removing their last one returns them to the first-run screen

### AC-11 (US-05) — error

**Given** a signed-in Traveler whose tracked destinations cannot be read for any reason other than a confirmed invalid sign-in (which is AC-14's case) — no connectivity, a failure on the app's side, a timeout, an unreadable answer
**When** the Traveler opens the app
**Then** the system shows one recoverable error, the same presentation whatever the underlying cause, carrying a retry control the Traveler may use as often as they like, and nothing retries on its own before that error is shown; the first-run screen is never shown in this state — a Traveler is only told they have nothing tracked when the system has actually confirmed that they have nothing tracked

### AC-12 (US-06) — happy path

**Given** a signed-in Traveler using a narrow screen
**When** the Traveler opens the app
**Then** the system keeps the list behind a control in the app shell's header rather than beside the content, and every surface this feature opens over the content — the list, the add picker and the removal confirmation — behaves the same way: opening it moves keyboard focus into it, closing it returns focus to the control that opened it, and the Escape key closes it; choosing a destination both opens it and closes the list

### AC-13 (US-02) — authorization

**Given** a visitor who is not signed in
**When** they open any screen of this feature, including the first-run screen and a saved address naming a tracked destination
**Then** the system sends them to sign in and reveals nothing about any Traveler's tracked destinations — not their number, not their names, not whether the address named a real one; after they sign in successfully the system returns them to the address they were trying to reach, where AC-06 then applies normally if it is not theirs

### AC-14 (US-02) — cross-context

**Given** a signed-in Traveler has their tracked destinations open when their sign-in stops being valid — it expires, or the auth provider ends it from another device
**When** the Traveler next acts on the list (adds, removes, or opens a destination) or the system next reads it, and the answer carries a confirmed invalid-sign-in signal
**Then** the system sends the Traveler to sign in and stops showing tracked destinations, rather than leaving a stale list on screen or letting the action appear to have succeeded; this outcome takes precedence over AC-11's recoverable error whenever the invalid sign-in is confirmed, and an idle page is not required to discover the invalidation on its own — nothing polls in the background for it

### AC-15 (US-02) — cross-context

**Given** a Traveler signs out and the system confirms their sign-in was ended
**When** a Traveler — the same one or a different one — subsequently signs in on that device
**Then** no tracked destination held for the previous Traveler is shown at any point, not even for an instant before the new Traveler's own list is read: what this feature remembered about the previous Traveler is discarded when that sign-out is confirmed

### AC-16 (US-03) — happy path

**Given** a signed-in Traveler opens one of their tracked destinations
**When** the system shows that destination's detail view
**Then** it names the destination and states that nothing is recorded for it yet — it shows no day-count, no trips, no way to enter either, and makes no claim about what a future release will add

### AC-17 (US-04) — error

**Given** a signed-in Traveler has confirmed the removal of one of their tracked destinations
**When** the system cannot complete the removal
**Then** the tracked destination remains in the Traveler's list exactly as it was, and one message tells them plainly that it was not removed — never wording that leaves it ambiguous whether the removal happened

## 6. Non-functional requirements

| Aspect | Target | Measurement |
|---|---|---|
| Showing a Traveler's tracked destinations | completes within 500 ms | a single timed run in the test suite against a stubbed network (matches the existing dashboard's first-render target; no production timing is collected this pass, §3) |
| Adding or removing a tracked destination | within 800 ms from the Traveler's action to the list reflecting the **confirmed** result (§1) | a single timed run in the test suite against a stubbed network, clocked from the action to the confirmed list state |
| List size | the list stays operable at 500 tracked destinations for one Traveler, where operable means every row is reachable by keyboard, the list renders within the first row's budget, and scrolling stays responsive | a test that builds a 500-entry list and asserts each of those three |
| Keyboard operability and accessibility | 0 violations at serious or critical severity on the list, the add picker and the removal confirmation; focus enters each of those surfaces on open and returns to its invoking control on close, with Escape closing each | an automated accessibility check at the serious-and-critical severity floor, plus component test assertions on focus movement for all three surfaces |
| Throughput | N/A | <!-- N/A: per-Traveler management of a personal list; no new load profile and no shared contention path --> |
| Availability | N/A | <!-- N/A: no new independently-deployed component; the feature inherits the existing app's availability --> |

## 6.1 Security / privacy

- **Data classification:** confidential — a Traveler's tracked destinations reveal where they are, have been, or intend to go, which is travel-intent data about an identifiable person.
- **Personal data touched:** one new category — the set of destinations a Traveler tracks, and when each was added, held against their existing account identity. No new identity fields, no contact details beyond the email the account already holds.
- **AuthZ/AuthN impact:** a new owned resource is introduced. Every read and every write is scoped to the signed-in Traveler; there is no sharing, no second role, and no path by which one Traveler's tracked destinations can be read or changed by another. Reachability requires a valid sign-in (AC-13), a sign-in that stops being valid stops the screens with it (AC-14), and a confirmed sign-out discards what this feature remembered (AC-15).
- **Abuse cases:**
  - **Enumeration through a saved address:** because the open destination is named in the address, an unowned or invented identifier can be probed. Response: not-yours, removed and never-existed are handled by the same path with the same single message and no early rejection by identifier shape (AC-06), so probing yields nothing.
  - **Shared-device leakage:** an address is not tied to an identity and survives a sign-out, so a second Traveler on the same device can land on a first Traveler's address. Response: AC-06 for the address, and AC-15 for the data — this feature discards what it remembered when a sign-out is confirmed, rather than relying on a guarantee made by another feature before these records existed.
  - **Unbounded creation:** repeated records are legitimate by design, so no uniqueness rule limits how many a Traveler creates. Response this pass: the list is required to stay operable at 500 entries (§6), so a large set degrades nobody's experience but the Traveler's own; whether to impose a hard limit is an open question (§8).
  - **Stale destination data:** a destination the app stops offering must not become a different one for Travelers already tracking it — references are permanent and never reused (AC-09). Visa durations are not shipped at all this pass (§3), so no Traveler can act on a stale duration from this feature.
  - **Cross-tenant leakage:** N/A — one account is one Traveler, and there is no organisation or shared workspace concept in this product.
- **Security review:** Required — a new owned resource with a new authorization boundary, a new category of personal data, and an identifier exposed in a shareable address.

## 7. Metrics / KPIs

Measurement is **deliberately deferred this pass** (§3 excludes analytics; §8 carries the owner and due date). Each metric below is named now with its baseline so the deferral is a decision rather than an omission; none is instrumented, and the targets are set when the owner in §8 picks a measurement approach.

- **Travelers with at least one tracked destination before their first sign-out or sign-in expiry** — baseline: 0% (impossible today; no tracked set exists), target: TBD — set by the §8 metrics owner; the tracked-destination records are themselves the evidence, so this is answerable by inspecting stored data without any event tracking.
- **Tracked sets surviving to a later sign-in unchanged** — baseline: 0% (nothing persists today), target: TBD — the same stored records answer it; it distinguishes a set worth keeping from an experiment.
- **Travelers reaching the first-run screen who leave without adding anything** — baseline: unknown (the screen does not exist), target: TBD — this one genuinely needs event tracking, and is the metric that would justify building it.

## 8. Open questions

- [ ] How should two tracked destinations for the same country be told apart in the list before visa types and dates exist? Default now: they are not — identical rows are accepted for this pass. — owner: Tech Lead, due: before the visa-type-and-dates feature ships
- [ ] Once trips exist, which of a Traveler's several records for one country owns a given physical stay — and is "tracked destination" still the right primitive, or should the model move to a permission-to-stay the Traveler holds? Default now: unresolved; the strategic review flagged the permission-to-stay model as the one that dissolves the problem. — owner: Tech Lead, due: before `/sdd:design` of the visa-type-and-dates feature
- [ ] What must removing a tracked destination do once trips point at it — refuse, cascade, or detach? Default now: not applicable; a record holds only a destination, so removal destroys nothing else. — owner: Tech Lead, due: before trip entry ships
- [ ] Who owns keeping the destination catalogue correct, and what triggers moving it out of the codebase so a policy change can reach Travelers faster than a deploy? Default now: it lives in code and changes on deploy, reviewed like any other change. — owner: PM, due: before the day-count feature ships
- [ ] How is this feature's success actually measured, and does that justify building event tracking for a product holding travel data? Default now: nothing instrumented; §7's first two metrics are answerable from stored records by hand. — owner: PM, due: before public launch
- [ ] Should this feature carry a priority score once the product has real users, so it can be ranked against what comes next? Default now: not scored — the product is pre-launch, so reach is theoretical and a score would read as more precise than it is. — owner: PM, due: before the roadmap orders a third feature
- [ ] Should a Traveler's tracked set be capped? Default now: no cap — repeated records are legitimate, and §6 requires the list to stay operable at 500 entries, so the blast radius is the Traveler's own account. — owner: Tech Lead, due: before `/sdd:data-model`
- [ ] When does offline creation — and offline reading — of tracked destinations arrive, given the app is described as offline-first and this pass is online-only in both directions? Default now: online-only; a failed read or add surfaces as a recoverable error. — owner: Tech Lead, due: when the sync feature is designed
