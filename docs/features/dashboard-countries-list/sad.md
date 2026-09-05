---
status: Draft
owner: "Tech Lead"
reviewers: ["Tech Lead", "Security Lead"]
updated_at: "2026-09-06"
feature_size: "M"
target_surfaces: [backend-service, web-frontend]  # filled in §4 — subset of: backend-service | web-frontend | mobile-app | desktop-app | cli | worker | library-sdk. Read (never re-derived) by api/sequences/tasks/plan-tests/review → _shared/surfaces.md
---

# Software Architecture Document — dashboard-countries-list

> Arc42, 12 sections. C4 Context (L1) is inline in §3 and C4 Container (L2) in §5; §6 seeds the
> runtime flows that the `sequences` stage completes. Every number in §10 is quoted from
> `spec.md` §6 as written. Decisions that crossed the blast-radius gate are ADRs under `adr/` and
> indexed in §9; decisions that did not are recorded inline and listed at the end of §9.
> Written against the repository at HEAD, not against `docs/architecture-map.md`, which is stale
> (see §11).

## 1. Introduction and goals

**Intent.** Give a Traveler a persistent, curated list of tracked destinations that becomes the app's home and primary navigation. Each record names one entry from the destination catalogue and nothing more; it is a slot that the committed next features extend in place with a visa type, dates and day-counts rather than replace. Today the dashboard body is a placeholder empty state, so nothing in the product can move until a Traveler can say which destinations they care about. This feature creates that object, the five-entry catalogue it draws from, and the screens that manage it — under the app shell that ships before it.

**Top-3 quality goals (1-liners; full scenarios in §10):**

1. **Confidentiality of a Traveler's tracked set** — readable and changeable only by its owner, with a not-yours address indistinguishable from a removed or never-existed one, and nothing of a previous Traveler surviving a confirmed sign-out on a shared device.
2. **Keyboard operability and accessibility of the three overlay surfaces** — the list drawer, the add picker and the removal confirmation each take focus on open, return it to their invoking control on close, and close on Escape, with zero serious or critical violations.
3. **Truthfulness of displayed state** — the screen never shows a state the system has not confirmed: no optimistic row on add, no disappearance before a removal is recorded, no first-run screen when the read merely failed, and no wording that leaves a failed removal ambiguous.

Responsiveness is a real requirement (spec §6: 500 ms to show the list, 800 ms to a confirmed add or removal) but does not lead: §3 excludes production timing this pass, so both numbers are single timed runs in the test suite rather than an operational objective. They are carried as verification leaves under QG-3 in §10.

**Stakeholders.**

| Role | Interest | Sign-off owner? |
|---|---|---|
| Traveler | The only human role in the product (one account = one Traveler; no admin or operator role exists). Creates, reads, opens and removes their own tracked destinations. | No |
| Tech Lead | SAD approval; owner of the §8 open questions on the record primitive, the offline deferral and the set cap | Yes |
| Security Lead | Mandatory security review (spec §6.1): a new owned resource, a new authorization boundary, a new category of personal data, and an identifier exposed in a shareable address | Yes |
| PM | Consulted on §10 quality goals and §11 severities; owns the deferred metrics decision and destination-catalogue ownership (spec §8) | No |

**Decision overrides.**

- Decision override: resolving a saved address goes through a by-identifier read endpoint rather than being resolved on the client against the Traveler's own list — rationale: it gives AC-06's indistinguishability one verifiable path shared by reads and removals, so §10 QG-1's test is executable as written. Taken in the critic resolution loop over the alternative of splitting QG-1's claim by path; the residual exposure of having a server oracle at all is recorded in §11 as Low, mitigated by the ownership-scoped query returning zero rows identically in all three cases (ADR-0008).
- Decision override: the overlay focus contract is hand-rolled rather than taken from a headless library, and carries no mitigation beyond §10 QG-2's component assertions and `axe-core` check — rationale: keeping `src/modules/ui/` dependency-free and consistent with the `code` design canon was preferred to the stronger correctness guarantee. Recorded as accepted risk in §11 (ADR-0004).

## 2. Constraints

**Technical.** Read from the repository at HEAD, not from `docs/architecture-map.md`, which is stale (it reflects commit `53d3d41` and still describes a greenfield baseline with Auth.js).

- TypeScript 5.5 on Node.js ≥ 22 (`package.json` `engines`), pnpm.
- Next.js 14.2 App Router; React 18.3. Pages are Server Components; interactive containers are `"use client"`.
- Clerk 7.8 (`@clerk/nextjs`) is the identity provider — **not** Auth.js. Server-side session via `await auth()` in `src/modules/auth/infra/session-deps.ts:10`; client-side via `useClerk()` / `useUser()`.
- `src/middleware.ts` uses a **narrow allowlist** matcher (`config.matcher`, lines 32–39), deliberately not Clerk's documented catch-all. Any route this feature adds is unauthenticated until listed there, and any client route mounting Clerk hooks must be listed for the Clerk context to initialize.
- PostgreSQL via Drizzle ORM 0.33 + `postgres` 3.4; `drizzle-kit` 0.24 for migrations. Existing schema is two tables only: `users`, `linked_identities` (`src/db/schema.ts`).
- TanStack Query 5.102 for client data. The `QueryClient` is instantiated per render in `src/app/providers.tsx` to avoid cross-Traveler leakage under SSR.
- Tailwind CSS 3.4 with `tailwind.config.ts` present and unextended — default breakpoints (`sm` 640 / `md` 768 / `lg` 1024 / `xl` 1280). No component library, no headless-UI or Radix dependency.
- Vitest 2.0 + Testing Library + jsdom 30.0.1 for unit and component tests; Playwright 1.46 for e2e; `@electric-sql/pglite` available for database-backed tests. No accessibility-checking tool is wired today.
- **jsdom 30.0.1 does not implement `HTMLDialogElement.showModal`** (verified by probe in this repository). Anything relying on the native modal dialog is therefore untestable at the component level here, which is where §6 requires the focus assertions to run.

**Organisational.**

- Team: one developer. No parallelism to exploit, so §4 prefers the smallest reviewable diff over decomposition that only pays off across people.
- Deadline: none — the product is pre-launch, which is the same reason spec §8 declines to score its priority. Scope, not the calendar, is the binding constraint.
- Effort budget: not fixed. Anything that would materially grow the change becomes a §11 row rather than silent scope growth.
- Sequencing constraint (hard): the **app shell feature ships first** (spec §1, §3). This SAD assumes the shell owns the header, the logout action and the one-time linked-account confirmation, and it places **two** requirements on it:
  1. a header slot a page can put a navigation control into, which is where the narrow-screen list toggle lives (AC-12) — the requirement spec §1 already names;
  2. that its **confirmed sign-out clears the query cache** (`queryClient.clear()`), which is how AC-15 is met. ADR-0007 deliberately makes this clear app-wide rather than per-resource, so it belongs at the app-wide sign-out point the shell owns rather than inside any one feature. Whoever specifies the shell reads both as inputs.

**Conventions.** Project convention file: `CLAUDE.md`; design canon: `docs/design-system.md`.

- Feature-first modules under `src/modules/<name>/`, each owning its own `ui` / `app` / `infra`. No shared components/services/hooks grab-bag; shared UI primitives live in `src/modules/ui/`.
- Unified error envelope `{ error: { code, message, details? } }` from every API route, produced by `toErrorEnvelope` / `mapUnknownError` in `src/lib/errors.ts`; `AppError(code, message, status, details?)` is the thrown form. Error codes are namespaced per module (`auth.*` today).
- App-layer functions return a typed `{ status, body }` result and the route serializes it — established by `src/modules/dashboard/app/get-dashboard.ts` and `src/app/api/v1/dashboard/route.ts`.
- Query keys are `[<resource>, userId]` (`src/modules/dashboard/app/dashboard-query.ts:48`), with `staleTime: Infinity`, `gcTime: Infinity`, `retry: false`, and no refetch on focus or reconnect.
- IDs: UUIDv7 generated app-side per `CLAUDE.md` — **no helper exists yet**; this feature is the first to need one.
- Drizzle ORM only, no raw SQL outside `src/db/`; one `drizzle-kit` migration per schema change, forward **and** down (`drizzle/NNNN_*.sql` + `.down.sql`).
- Tests colocated as `*.test.ts(x)` beside source; Playwright e2e under `e2e/`.
- Tailwind utility classes only, no CSS-in-JS.
- Copy is externalized as dot-notation keys in `src/lib/i18n/en.json`, resolved server-side by `translate()` and passed into components as an overridable `strings` prop.

**Regulatory / external.**

- No formal regime (no GDPR/DPA programme, no retention policy) applies to this pre-launch product today. The binding external requirement is the one spec §6.1 sets itself: **a security review is required** before this ships — a new owned resource, a new authorization boundary, a new category of personal data (travel intent), and a resource identifier exposed in a shareable address.
- Removal is a permanent hard delete by decision (spec §1), so no retention or archival obligation is inherited.

## 3. Context and scope

A Traveler signs in and manages a personal, curated list of tracked destinations — adding one from the five destinations the app supports, opening it at its own address, and removing it permanently behind a confirmation. The list is the app's home and its primary navigation. The system holds one new category of personal data (which destinations a Traveler tracks, and when each was added) and exposes no way for one Traveler to read or change another's.

<!-- brownfield: scanned at HEAD e1a1ecc. Real modules: auth (app/infra/ui, Clerk-backed), dashboard (app/ui, header + "Nothing tracked yet." placeholder), ui (8 primitives), sync (Dexie initialized, zero stores). Schema is users + linked_identities only. No dynamic route segment, no overlay/focus-trap primitive, no UUIDv7 helper, no accessibility tooling. docs/architecture-map.md is stale — it predates the auth and query features and names Auth.js. -->

**External systems (in / out):**

| Actor or system | Type | Interaction |
|---|---|---|
| Traveler | Person | Adds, views, opens and removes their own tracked destinations over HTTPS. The only human role — one account is one Traveler; no admin, operator or organisation concept exists. |
| Clerk | System (external) | Hosted identity provider, already integrated by the shipped auth feature. Answers who the caller is on every read and write of a tracked destination, and is the authority that declares a sign-in invalid (AC-14) or ended (AC-15). |
| PostgreSQL | System (internal) | The system's own store, not another party. Drawn as a container in §5 rather than an external system here; hosting is deliberately unspecified. |

Nothing else crosses the boundary. There is no analytics or telemetry egress (spec §3), no third-party source for the destination catalogue — it is five entries defined in code (spec §3 excludes Traveler-defined destinations; who owns it and what would move it out of the codebase is spec §8, owned by PM) — and no email or notification path. The **app shell** is inside the system but outside this feature: it ships first, owns the header, logout and the linked-account confirmation. This feature places two requirements on it (§2): a header slot for the narrow-screen list control, and a confirmed sign-out that clears the query cache, which is what AC-15 rests on.

**Trust boundary.** Clerk's answer to "who is calling" is the line. Everything on the far side is untrusted, including two inputs that look trustworthy but are not: the destination reference submitted on an add (the picker offers only five, but the criterion in AC-02 is a guarantee the system upholds for *any* request, however it arrives) and the tracked-destination identifier arriving in a URL (AC-06 — it may name another Traveler's record, a removed one, or nothing at all, and all three must be indistinguishable).

**C4 Context (L1):**

```mermaid
C4Context
    title dashboard-countries-list — System Context

    Person(traveler, "Traveler", "Tracks the destinations they need to keep an eye on; one account is one Traveler")

    System(daysleft, "daysleft", "Next.js web app holding each Traveler's tracked destinations and the destination catalogue")

    System_Ext(clerk, "Clerk", "Hosted identity provider; establishes and invalidates the Traveler's sign-in")

    Rel(traveler, daysleft, "Adds, opens and removes tracked destinations", "HTTPS")
    Rel(daysleft, clerk, "Establishes who the caller is on every read and write", "HTTPS")
```

## 4. Solution strategy

**Top strategic choices (the seeds for ADRs):**

1. **Serve the list over an HTTP API consumed by TanStack Query** — the browser reaches tracked destinations through `/api/v1/destinations` endpoints, read and mutated through query and mutation hooks, rather than through Server Components and server actions. This is the surface decision: it declares `target_surfaces: [backend-service, web-frontend]`, because an HTTP endpoint is a container distinct from the web app while a server action is not. It reproduces exactly what both shipped features already do (`src/app/api/v1/dashboard/route.ts` + `src/modules/dashboard/app/dashboard-query.ts`), gives the `api` stage a real contract to lock, and leaves the deferred offline-sync feature (spec §8) a server interface to reuse. It also makes AC-11's single recoverable error and AC-14's session-invalid precedence expressible in the one place that already expresses them — the query layer's error path. → **ADR-0001**.

2. **Name an open tracked destination in a dynamic path segment under the existing home** — `/dashboard/[trackedDestinationId]`, with `/dashboard` as the plain home address AC-06 and AC-07 fall back to. "Saved address" is a glossary term, so this is a shipped guarantee rather than an internal detail: it is what AC-05's reload, AC-06's replacement and AC-13's return-after-sign-in all operate on. The existing narrow-allowlist middleware matcher already covers `/dashboard/:path*` and the shipped `return_to` mechanism already round-trips such a path, so the choice costs no change in the app shell's territory. → **ADR-0002**.

3. **Give the feature its own `destinations` module beside `dashboard`** — `src/modules/destinations/` owns the destination catalogue, the tracked-destination app logic, the query layer and every screen; `src/modules/dashboard/` keeps only what the shell feature leaves it and renders the destinations module in its body. The domain primitives are "tracked destination" and "destination catalogue" (glossary), not "dashboard", and trips and rules will import them by that name. Retiring the dashboard module outright was rejected on sequencing: §2 fixes the shell as shipping first, and two features rewriting one folder in sequence is how a shipped guarantee gets dropped. → **ADR-0003**.

4. **Build one in-repo `Modal` primitive and give all three overlay surfaces the same focus contract through it** — the list drawer, the add picker and the removal confirmation are one behaviour used three times (focus in on open, focus back to the invoking control on close, Escape closes), so the contract lives in a single `src/modules/ui/Modal` rather than being re-implemented per surface. It is hand-rolled with no dependency, matching the eight existing zero-dependency primitives and the `code`-tool design canon. Native `<dialog>` was excluded on evidence, not taste: jsdom 30 in this repo does not implement `showModal`, so §6's required focus assertions would exercise a polyfill instead of shipped behaviour. The correctness risk this carries is accepted and tracked in §11. → **ADR-0004**.

5. **Confirm every write on the server, then splice the confirmed record into the cache** — no optimistic display anywhere (spec §1): a create responds with the tracked destination it recorded and a removal confirms the record it removed, and only then does `onSuccess` update the cached list through `setQueryData`. One round trip keeps §6's 800 ms budget — which is clocked to the *confirmed* state — achievable, while the list still never shows something the system has not recorded. The cost is that the client splice must reproduce the server's ordering rule, so ordering is specified once in §8 and implemented in two places. → **ADR-0005**.

**Bundled convention defaults** (taken from the repository, not decided here): error codes namespaced `destinations.*` under the existing envelope; query key `["destinations", userId]`; `staleTime`/`gcTime` `Infinity` with `retry: false` and no refetch on focus or reconnect — which is already exactly what AC-11 demands, a retry only when the Traveler asks and nothing retrying on its own; copy externalized as `destinations.*` keys in `src/lib/i18n/en.json` and passed as an overridable `strings` prop; the five-entry catalogue defined inside the `destinations` module, since nothing else reads it.

Each tactical decision in later sections traces to one of these seeds. Tactical decisions that *contradict* a strategic choice are red flags — surfaced in §11.

## 5. Building block view

The module is **layered feature-first**, matching the shape `src/modules/auth/` already established: `ui` holds React components and containers, `app` holds use-case functions that take an injected dependency object and return a typed `{ status, body }` result, and `infra` holds the Drizzle repository plus the dependency builder that wires it. There is no `domain` layer because there is no behaviour to put in one this pass — a tracked destination holds a destination reference and a creation time and nothing else. Domain logic arrives with visa types, dates and the rules engine, and the layer arrives with it.

The **destination catalogue is a frozen constant**, not a table and not a container: five entries, each a permanent reference plus a display name, compiled into both the API routes (which validate against it) and the web UI (which populates the picker from it). A `tracked_destinations` row stores its catalogue reference as a text column, and the app layer refuses any reference the catalogue does not contain before writing anything. This is what makes AC-09 fall out for free — delisting a destination means removing it from the addable set while every stored reference keeps resolving, so a delisted destination stays fully openable and removable. AC-02's refusal is therefore enforced in code rather than by the database, and it carries its own test (§10) rather than being structurally impossible. → **ADR-0006**.

**Internal decomposition:**

```
src/modules/destinations/
├── app/
│   ├── catalogue.ts                  frozen five-entry catalogue + reference lookup
│   ├── list-tracked-destinations.ts  use case: read the signed-in Traveler's list
│   ├── add-tracked-destination.ts    use case: validate the reference, record, return the record
│   ├── remove-tracked-destination.ts use case: authorize ownership, hard-delete, confirm
│   └── destinations-query.ts         query key, query options, mutations, typed session-invalid error
├── infra/
│   ├── tracked-destinations-repository.ts  Drizzle access, mirroring UsersRepository
│   └── destinations-deps.ts               buildDestinationsDeps(db), mirroring buildSessionDeps
└── ui/
    ├── DestinationsContainer.tsx     client container: query + mutations, error and session routing
    ├── DestinationList.tsx           the list itself, at both widths
    ├── DestinationListDrawer.tsx     the narrow-screen overlay wrapping DestinationList
    ├── DestinationPicker.tsx         the add picker overlay
    ├── RemoveConfirmation.tsx        the removal confirmation overlay
    ├── DestinationDetail.tsx         one tracked destination; name + nothing-recorded-yet
    ├── FirstRunScreen.tsx            no list beside it; single add action
    └── ListUnavailable.tsx           the one recoverable error presentation + Traveler-driven retry

src/modules/ui/
└── Modal/                            new shared primitive: focus in, focus restore, Escape (ADR-0004)

src/app/
├── dashboard/page.tsx                composed by the dashboard module; renders DestinationsContainer
├── dashboard/[trackedDestinationId]/page.tsx   the detail address (ADR-0002)
└── api/v1/destinations/
    ├── route.ts                      GET list, POST create
    └── [trackedDestinationId]/route.ts   GET one, DELETE

src/db/schema.ts                      + tracked_destinations
drizzle/                              + one forward migration and its down
src/lib/id.ts                         new: UUIDv7 generation (first consumer, per CLAUDE.md)
```

**C4 Container (L2):**

```mermaid
C4Container
    title dashboard-countries-list — Containers

    Person(traveler, "Traveler", "Manages their own tracked destinations")

    Container_Boundary(daysleft, "daysleft") {
        Container(web, "Web UI", "Next.js App Router, React 18, Tailwind (browser)", "Renders the list, the detail view and the three overlay surfaces; holds the per-Traveler TanStack Query cache")
        Container(api, "API routes", "Next.js route handlers, Node 22 (server)", "Authorizes every read and write, validates the destination reference against the catalogue, and is the only container that touches the database")
        ContainerDb(db, "Application database", "PostgreSQL via Drizzle ORM", "users, linked_identities, tracked_destinations")
    }

    System_Ext(clerk, "Clerk", "Hosted identity provider")

    Rel(traveler, web, "Adds, opens and removes tracked destinations", "HTTPS")
    Rel(web, api, "Reads the list and submits confirmed writes", "HTTPS / JSON")
    Rel(api, clerk, "Establishes who the caller is on every request", "HTTPS")
    Rel(api, db, "Reads and writes tracked destinations", "Drizzle / postgres")
```

Every screen in the `ux-flows` inventory has a home here: SCR-01 is `FirstRunScreen`, SCR-02 `DestinationPicker`, SCR-03 `DestinationList` with `DestinationDetail` absent, SCR-04 `DestinationDetail`, SCR-05 `DestinationListDrawer`, SCR-06 `RemoveConfirmation`, SCR-07 `ListUnavailable`. SCR-07 is a component rather than an inline branch deliberately: AC-11 requires the same presentation whatever the cause and it is entered from four different flows, so one component with its own test is what stops that guarantee drifting into four separate branches.

The web UI never reaches the database and never decides authorization for itself — it reads its own Clerk session only to render, and the answer that matters always comes back through the API. The Dexie local cache (`src/modules/sync/local/db.ts`, currently zero stores) is deliberately absent: spec §3 excludes every offline use of tracked destinations in both directions this pass.

## 6. Runtime view

Two flows are seeded here because they fix the runtime shapes every other flow reuses: write-then-confirm-then-splice, and single-path rejection with no early exit on the shape of an identifier. Participants are the §5 containers. Messages are semantic — endpoint-level detail arrives at the `api` stage, and the remaining flows at the `sequences` stage.

**Critical flow 1: adding a tracked destination (AC-01, AC-02)**

```mermaid
sequenceDiagram
    actor Traveler
    participant Web as Web UI
    participant Api as API routes
    participant Clerk
    participant Db as Application database

    Traveler->>Web: opens the add picker and chooses a destination
    Note over Web: nothing is added to the list yet — no optimistic row
    Web->>Api: asks to record a tracked destination for this catalogue reference
    Api->>Clerk: establishes who the caller is
    Clerk-->>Api: the Traveler's identity
    Api->>Api: checks the reference against the frozen catalogue
    alt reference is not in the catalogue
        Api-->>Web: refuses; nothing was recorded
        Web-->>Traveler: reports that only supported destinations can be tracked
    else reference is supported
        Api->>Db: records a new tracked destination owned by this Traveler
        Db-->>Api: the recorded destination
        Api-->>Web: confirms, returning the recorded destination
        Web->>Web: splices the confirmed record into the cached list
        Web-->>Traveler: shows it in the list and opens its detail view, moving focus there
    end
```

The Traveler may already track the same destination; that is allowed and creates a separate record, so nothing in this flow consults the existing list before recording. The list changes only on the confirming branch — the §6 budget of 800 ms is measured across this whole exchange, which is why it is one round trip (ADR-0005). A failure of the recording step leaves the cache untouched and surfaces the recoverable error of AC-11.

**Critical flow 2: resolving a saved address (AC-05, AC-06, AC-13)**

```mermaid
sequenceDiagram
    actor Traveler
    participant Web as Web UI
    participant Api as API routes
    participant Clerk
    participant Db as Application database

    Traveler->>Web: opens a saved address naming a tracked destination
    Web->>Api: asks for the tracked destination that address names
    Api->>Clerk: establishes who the caller is
    alt no valid sign-in
        Clerk-->>Api: no identity
        Api-->>Web: refuses, revealing nothing about any tracked destination
        Web-->>Traveler: sends them to sign in, remembering the address they wanted
    else signed in
        Clerk-->>Api: the Traveler's identity
        Api->>Db: reads the tracked destination with this identifier owned by this Traveler
        Db-->>Api: one record, or none
        alt one record
            Api-->>Web: the tracked destination
            Web-->>Traveler: opens that destination's detail view
        else none
            Note over Api: one query, one answer — not-yours, removed and never-existed are the same miss
            Api-->>Web: refuses identically in all three cases
            Web-->>Traveler: selects nothing, replaces the address with the plain home address, and shows one message
        end
    end
```

The three rejection cases share a single branch by construction rather than by discipline. The handler asks one question — is there a record with this identifier that belongs to the caller — and the ownership-scoped query returns zero rows in all three cases, executing the same plan whether the row is someone else's, was removed, or never existed. There is no shape check, format validation or existence probe that could reject earlier or differently, and no second query whose presence or absence could be timed. The Traveler's own list is fetched alongside this resolution to render the list beside the content; it is not what answers the address.

**The opening read** forks four ways — a confirmed read with records, a confirmed read with none (the only route to the first-run screen), a confirmed invalid sign-in, and every other failure. A confirmed invalid sign-in takes precedence over the recoverable error, and nothing retries on its own before that error is shown. It is drawn in full at the `sequences` stage; its precedence rule is fixed here and in §8.

## 7. Deployment view

This feature introduces **no new deployment unit**. It ships inside the existing single Next.js application — the web UI and the API routes of §5 are two C4 containers but one deployable — and adds one table to the PostgreSQL instance the app already uses. No hosting target has been chosen for either the app or the database; `docs/architecture-map.md` deliberately leaves it out on the grounds that it does not change the architecture, and that remains true here.

The one topological requirement is **ordering**: the `tracked_destinations` migration must be applied before the code that reads it is serving traffic. The repository has `pnpm db:up` and `pnpm db:down` (`scripts/migrate-up.ts` / `migrate-down.ts`) but no deployment pipeline that invokes them, so today this is a manual step and stays one. Because a missing table surfaces as a read failure, the failure mode of getting the order wrong is AC-11's recoverable error rather than data loss — an acceptable outcome for a pre-launch product with one developer, and the reason this is not raised further.

The existing CI workflow (`.github/workflows/ci.yml`) runs `pnpm build`, `pnpm test`, `pnpm lint` and `pnpm test:e2e` on every push to `main` and every pull request, against Node 22 and pnpm 11. That is the only gate this feature passes through, and it is where §10's verification actually runs.

**Monitoring:**

- None is added, and none exists. Spec §3 excludes analytics, telemetry, event tracking and production timing measurement, with the reason that choosing a measurement path for a product holding travel data is its own decision rather than a rider on a UI feature. Spec §8 carries that decision with PM as owner, due before public launch.
- The consequence is stated plainly so it is not discovered later: **every §6 target is verified in the test suite and nowhere else**. Nothing in production will report that the list took longer than 500 ms, that a write exceeded 800 ms, or that reads are failing. The first signal of a problem is a Traveler noticing.

**Scaling thresholds:**

- One Traveler's list must stay operable at **500 tracked destinations** (spec §6). Below that ceiling the read returns the whole list unpaginated, which is what ADR-0005's cache splice assumes.
- Above it, the design would need pagination or virtualization, and ADR-0005's splice would have to become an invalidation. Nothing this pass builds toward that; whether to cap the set at all is a spec §8 open question owned by Tech Lead, due before `/sdd:data-model`.
- The table's growth is bounded by Travelers × their own list sizes, with no shared contention path and no new load profile (spec §6 marks throughput N/A for exactly this reason). A single unpartitioned table is comfortable well past any pre-launch volume.

## 8. Crosscutting concepts

| Concept | Convention | Where defined |
|---|---|---|
| Authentication | Clerk. Server side: `await auth()` behind an injected `getAuthUserId` dependency, mirroring `buildSessionDeps`. Client side: `useUser()` / `useClerk()` for rendering only — never for an authorization decision. | `src/modules/destinations/infra/destinations-deps.ts`; precedent `src/modules/auth/infra/session-deps.ts:10` |
| Authorization | Ownership is the only rule: every read and every write is scoped to the caller's own Traveler id in the query itself, never filtered after the fact. There is no role, no sharing and no second principal. | §5 app layer; ADR-0008 |
| Route protection | Every new page and API route is added to the narrow allowlist in `src/middleware.ts`. `/dashboard/:path*` already covers the detail page; `/api/v1/destinations` and `/api/v1/destinations/:path*` must be added explicitly. | `src/middleware.ts` `config.matcher` |
| Error handling | Unified envelope `{ error: { code, message } }` via `toErrorEnvelope` / `mapUnknownError`; app-layer functions return typed `{ status, body }` and the route serializes. Codes namespaced `destinations.*`: `destinations.unsupported_reference` (AC-02), `destinations.not_found` (AC-06 / removal). | `src/lib/errors.ts`; §5 app layer |
| Not-found as authorization | A tracked destination that is not the caller's, one that was removed, and one that never existed are one case with one code (`destinations.not_found`), one message and one code path — for reads and removals alike. Both go through the same ownership-scoped lookup, which returns zero rows in all three cases and executes the same plan, so no branch inspects the shape of an identifier and none can be timed apart. | ADR-0008 |
| Error precedence | A confirmed invalid sign-in always wins: the client routes to sign-in and stops showing tracked destinations rather than rendering the recoverable error. Every other failure — offline, timeout, unreadable answer, server fault — collapses into one presentation with a Traveler-driven retry. Nothing retries on its own (`retry: false`), and nothing polls in the background for invalidation. | ADR-0001; spec AC-11, AC-14 |
| Session discard | On a confirmed sign-out the whole query cache is dropped with `queryClient.clear()`, not a list of named keys, so no future resource can leak by forgetting to register. | ADR-0007 |
| ID strategy | UUIDv7, generated app-side by a new shared `src/lib/id.ts` — this feature is the repository's first consumer of the convention `CLAUDE.md` already mandates. | ADR-0009; `CLAUDE.md` |
| Ordering | One rule, stated once and implemented twice (server read query, client cache splice): recorded order, most recent last, with the record's own identifier settling ties. UUIDv7's time-sortability makes the tie-break agree with recorded order rather than being arbitrary. | ADR-0005, ADR-0009; spec AC-03 |
| Overlay focus contract | One `src/modules/ui/Modal` primitive owns it for all three surfaces: focus moves in on open, returns to the invoking control on close, Escape closes. Surfaces never implement it themselves. | ADR-0004; spec AC-12 |
| Catalogue validation | Every write validates its destination reference against the frozen in-code catalogue before recording anything, at the app-layer boundary rather than in the UI — the refusal is a guarantee for any request, whatever path it arrives by. | ADR-0006; spec AC-02 |
| Persistence | Drizzle ORM only, no raw SQL outside `src/db/`; access through a `TrackedDestinationsRepository` injected as a dependency, mirroring `UsersRepository`. One `drizzle-kit` migration, forward and down. | `CLAUDE.md`; precedent `src/modules/auth/infra/users-repository.ts` |
| Client data | TanStack Query. Key `["destinations", userId]`; `staleTime` and `gcTime` `Infinity`, `retry: false`, no refetch on focus or reconnect — which is exactly AC-11's requirement that retries happen only when the Traveler asks. Writes are mutations whose confirmed record is spliced into the cache. | ADR-0001, ADR-0005; precedent `src/modules/dashboard/app/dashboard-query.ts:48` |
| Internationalisation | Copy externalized as `destinations.*` dot-notation keys in `src/lib/i18n/en.json`, resolved server-side by `translate()` and passed into components as an overridable `strings` prop. Single language; no i18n framework. | `src/lib/i18n/`; precedent `src/app/dashboard/strings.ts` |
| Logging | Nothing structured exists in the repository and none is added. A server fault reaches the Traveler as AC-11's recoverable error and reaches the developer only through the platform's own output. | — |
| Observability | N/A this pass — spec §3 excludes analytics, telemetry and production timing; §7 states the consequence that every §6 target is verified in tests and nowhere else. | spec §3, §8 (PM-owned) |
| Events | N/A — no asynchronous flow, no queue, no background worker. Every operation is a synchronous request the Traveler is waiting on. | — |
| Offline | N/A this pass, deliberately and against the project's stated offline-first baseline: reads and writes both require the network, and their absence surfaces as AC-11's recoverable error. The Dexie store stays empty. | spec §3, §8 (Tech Lead-owned) |

## 9. Architecture decisions

| # | Title | Status | Section |
|---|---|---|---|
| 0001 | Serve tracked destinations over an HTTP API consumed by TanStack Query | Accepted | §4 |
| 0002 | Address an open tracked destination as a path segment under /dashboard | Accepted | §4 |
| 0003 | Give the feature its own destinations module beside dashboard | Accepted | §4 |
| 0004 | Build one in-repo Modal primitive for all three overlay surfaces | Accepted | §4 |
| 0005 | Confirm writes server-side, then splice the confirmed record into the cache | Accepted | §4 |
| 0006 | Store the catalogue reference as a validated text column | Accepted | §5 |
| 0007 | Clear the whole query cache on a confirmed sign-out | Accepted | §8 |
| 0008 | Answer not-yours, removed and never-existed identically | Accepted | §8 |
| 0009 | Generate UUIDv7 identifiers app-side in a shared helper | Accepted | §8 |

ADR files live under `docs/features/dashboard-countries-list/adr/NNNN-<title>.md`.

Decisions taken during the walk that did **not** cross the blast-radius gate, recorded inline instead: the `destinations.*` error-code namespace and the `["destinations", userId]` query key (both mechanical extensions of shipped conventions, §8); the layering of the new module as `ui` / `app` / `infra` with an injected repository (established by `src/modules/auth/`, §5); the catalogue living inside the `destinations` module rather than in a module of its own (§4); and where the accessibility check runs (§10 QG-2) — one criterion only, contained to test tooling.

## 10. Quality requirements

Each top-3 goal from §1 expanded into a full scenario. Every number is quoted from spec §6 as written; none is rounded and none is invented. Spec §3 excludes production timing, so every verification below happens in the test suite and nowhere else — §7 states the consequence.

**QG-1. Confidentiality of a Traveler's tracked set**

- **When:** a request touches tracked destinations that are not the caller's — a saved address naming another Traveler's record, a removed one or one that never existed; a removal request naming any of those; a create naming a destination reference the catalogue does not contain; or a second Traveler signing in on a device a first Traveler just signed out of.
- **Then:** every read and every write resolves against the caller's own records only. All three not-yours cases produce one outcome by one path — one `destinations.not_found`, one message, no early rejection on identifier shape and no difference in what the Traveler sees — and this holds identically for reading a destination by its saved address and for removing one, because both resolve through the same ownership-scoped lookup. An unsupported reference is refused with `destinations.unsupported_reference` and nothing is recorded, whatever path the request arrived by. On a confirmed sign-out the whole query cache is cleared, so nothing of the previous Traveler is shown at any point — not even for an instant — before the new Traveler's own list is read. An unauthenticated visitor is sent to sign in and learns nothing: not the number of tracked destinations, not their names, not whether the address named a real one.
- **How verify:** app-layer tests asserting the ownership scope is in the query rather than applied afterwards; a test asserting the three not-yours cases are indistinguishable in status, code and message, run against both the by-identifier read and the removal; a test that submits an unsupported reference directly to the app layer, bypassing the picker entirely (AC-02 is a guarantee for any request, and ADR-0006 makes it code-enforced rather than database-enforced, so this test is the guarantee); a test asserting `queryClient.clear()` runs on a confirmed sign-out and that a second Traveler's first render shows nothing of the first; an e2e path confirming an unauthenticated visit redirects and reveals nothing. Security review sign-off is required before ship (spec §6.1).

**QG-2. Keyboard operability and accessibility of the three overlay surfaces**

- **When:** a Traveler operates the list, the add picker or the removal confirmation by keyboard, at any screen width.
- **Then:** **0 violations at serious or critical severity** on the list, the add picker and the removal confirmation. Focus enters each of those surfaces on open and returns to its invoking control on close, with Escape closing each. On a narrow screen the list sits behind a control in the app shell's header, opening it moves focus into it, and choosing a destination both opens that destination and closes the list. Separately, the list stays operable at **500 tracked destinations** for one Traveler, where operable means every row is reachable by keyboard, the list renders within the first row's budget, and scrolling stays responsive.
- **How verify:** an automated accessibility check at the serious-and-critical severity floor, run as `axe-core` inside the Vitest component tests for all three surfaces — this is the main independent evidence that ADR-0004's hand-rolled focus trap is correct, so it is load-bearing rather than a formality. Alongside it, component-test assertions on focus movement for all three surfaces: focus in on open, focus back to the invoking control on close, Escape closes. And a test that builds a 500-entry list and asserts each of those three operability properties. The known limit is recorded rather than glossed: jsdom is not a browser, so this check sees structure and ARIA but not computed contrast or real focus order.

**QG-3. Truthfulness of displayed state**

- **When:** a Traveler adds or removes a tracked destination, or opens the app when the list cannot be read.
- **Then:** the list changes only after the system has recorded the change, never optimistically ahead of confirmation — a new destination appears once the create is confirmed, and a removed one disappears once the removal is confirmed. A removal that cannot be completed leaves the tracked destination in the list exactly as it was, with one message saying plainly that it was not removed. A read that fails for any reason other than a confirmed invalid sign-in shows one recoverable error, the same presentation whatever the cause, with a retry the Traveler may use as often as they like and nothing retrying on its own beforehand; the first-run screen is never shown in this state. A confirmed invalid sign-in takes precedence over that error. Showing a Traveler's tracked destinations **completes within 500 ms**; adding or removing one completes **within 800 ms** from the Traveler's action to the list reflecting the confirmed result.
- **How verify:** component tests asserting no row appears or disappears before the mutation resolves, and that a rejected mutation leaves the cached list byte-identical; a test asserting the failed-removal message states unambiguously that the removal did not happen; tests asserting every non-401 failure mode — offline, server fault, timeout, unreadable answer — produces the same error presentation with a Traveler-driven retry, and that no automatic retry precedes it; a test asserting the first-run screen is reachable only from a confirmed empty read; a test asserting a confirmed invalid sign-in wins over the error path. For the two timings, a single timed run in the test suite against a stubbed network, the second clocked from the action to the confirmed list state — matching spec §6's stated measurement exactly, and carrying its stated limitation: these are single runs, not production measurements.

## 11. Risks and technical debt

No decision was deferred during the Socratic walk, so no row here originates from a save-as-open-question. The three `Open question` rows are spec §8 items that bind an architectural stage rather than a product choice, carried forward with the owner and due date the spec already assigned them.

| Risk / debt | Severity | Mitigation | Owner |
|---|---|---|---|
| The app shell may not ship first, or may ship without one of the two things §2 requires of it: a header slot a page can place a navigation control into, and a confirmed sign-out that clears the query cache. Without the slot, AC-12's narrow-screen list control has nowhere to live; without the cache clear, AC-15 fails silently and a second Traveler on a shared device can be shown the first Traveler's list. | High | Spec §1 names the slot; the cache clear is added by this SAD (§2, ADR-0007) and whoever specifies the shell reads both as inputs. Confirm both exist before starting `tasks`; if either does not, this feature blocks rather than re-absorbing the shell. | Tech Lead |
| Hand-rolled focus trapping (ADR-0004) is where QG-2 rests, and its classic defects — shift-tab wrapping at the first focusable element, ordering when one surface opens over another, restoring focus to a control that has since unmounted — are subtle enough to pass a component test. The jsdom accessibility check cannot see real focus order or computed contrast. | Medium | **Accepted with no additional mitigation, deliberately.** The evidence is what §10 QG-2 already commits to: component-test assertions on focus movement for all three surfaces plus `axe-core` at the serious-and-critical floor. A real-browser check was considered and declined this pass. | Tech Lead |
| The ordering rule exists in two implementations — the server's read query and the client's cache splice (ADR-0005) — and they can drift, producing a list that is ordered one way on first load and another after an add. | Medium | The rule is stated once in §8 and both implementations cite it. A test that adds a record and asserts the spliced list matches a freshly read one would close it; §10 QG-3's assertions cover the confirmed-state property but not this equivalence. | Tech Lead |
| AC-02's refusal of an unsupported destination reference is enforced in application code, not by the database (ADR-0006). A future write path that skips the app layer would store a reference the catalogue does not contain. | Medium | §10 QG-1 tests the refusal at the app-layer boundary, bypassing the picker, so the guarantee is asserted where it lives. `CLAUDE.md`'s rule that no raw SQL exists outside `src/db/` keeps the number of possible write paths at one. | Tech Lead |
| Nothing is observable in production. Every §6 target is verified by a single timed run in the test suite and nowhere else; no error rate, no latency, no failure signal exists. The first indication that reads are failing or writes are slow is a Traveler noticing. | Medium | Accepted this pass by spec §3, which excludes analytics, telemetry and production timing on the grounds that choosing a measurement path for a product holding travel data is its own decision. §7 states the consequence explicitly so it is not discovered later. | PM (spec §8, due before public launch) |
| `docs/architecture-map.md` is stale and actively misleading: it reflects commit `53d3d41`, states that no code exists yet, names Auth.js as the identity provider where the app uses Clerk, and describes a server-actions data approach that neither shipped feature follows. A reader trusting it would design against a system that does not exist. | Medium | This SAD's §2, §3 and §5 are written from the repository at HEAD and supersede the map for this feature. Re-run `/sdd:survey` in brownfield mode to refresh it. | Tech Lead |
| Resolving a saved address goes through a by-identifier read endpoint (ADR-0008), so a prober now has a direct server oracle where §6's earlier client-side resolution had none. | Low | The endpoint runs one ownership-scoped query that returns zero rows for not-yours, removed and never-existed alike, so all three execute the same plan and return the same status, code and message — there is no second query, no shape check and no early exit to time apart. §10 QG-1 asserts the indistinguishability against this endpoint directly. | Tech Lead |
| A UUIDv7 identifier embeds a millisecond creation timestamp, so anyone holding a saved address learns when that tracked destination was created (ADR-0009). | Low | Accepted. The address is already the owner's to hold or share, and it discloses nothing the address does not. Adding a separate opaque public identifier remains additive if that changes. | Tech Lead |
| `queryClient.clear()` (ADR-0007) supersedes the shipped `clearDashboardQuery` named-key pattern, leaving two ways to do the same thing and a weaker one still in the tree. | Low | Retire `clearDashboardQuery` **after the shell ships**, not in this feature's diff — it lives in `src/modules/dashboard/`, which ADR-0003 deliberately leaves untouched while the shell is rewriting it. Once the shell owns the sign-out clear (§2), the retirement is the shell's to make. | Tech Lead |
| Open architectural decision: should a Traveler's tracked set be capped? | Open question | Resolve before `/sdd:data-model`. Default now: no cap — repeated records are legitimate by design, and §6 requires the list to stay operable at 500 entries, so the blast radius is the Traveler's own account. | Tech Lead |
| Open architectural decision: when does offline creation — and offline reading — of tracked destinations arrive, given the app is described as offline-first and this pass is online-only in both directions? | Open question | Resolve when the sync feature is designed. Default now: online-only; a failed read or add surfaces as AC-11's recoverable error. ADR-0001's HTTP surface is what a sync layer would reconcile against. | Tech Lead |
| Open architectural decision: is "tracked destination" still the right primitive once trips exist, or should the model move to a permission-to-stay the Traveler holds? | Open question | Resolve before `/sdd:design` of the visa-type-and-dates feature. Default now: unresolved; the strategic review flagged permission-to-stay as the model that dissolves the problem. Every §5 building block assumes the current primitive. | Tech Lead |

**Accepted debt (acceptable in v1, plan to fix later):**

- **Two modules cover one screen** — `dashboard` composes the page and `destinations` fills it (ADR-0003), and `/api/v1/dashboard` remains, returning a `has_trips` flag nothing in this feature reads. Retiring the dashboard module is a mechanical move once the shell has settled.
- **`/dashboard` names a screen where the domain says tracked destinations** (ADR-0002). Renaming is a redirect and a matcher edit, cheap while the product is pre-launch and no real bookmark exists to break.
- **The offline-first baseline is not met** — reads as well as writes require the network, against a project baseline that calls the app offline-first. Deliberate (spec §3): the offline write path's conflict strategy belongs to the sync feature's own decision record, not to this one.
- **No `domain` layer in the new module** — a tracked destination holds a reference and a creation time, so there is no behaviour to put in one. The layer arrives with visa types, dates and the rules engine.

## 12. Glossary

Domain terms are canonical from `CONTEXT.md` `## Glossary` (repo-root; no feature-scoped `CONTEXT.md` exists for this feature). The technical terms below are introduced by this SAD.

| Term | Meaning |
|---|---|
| Traveler | A person who signs up to track their own visa day-counts and plan visa runs; one account is one Traveler, with no multi-user or organisation concept. NOT an admin or staff role — no internal or operator role exists in this app. |
| Tracked destination | A record a Traveler creates naming one entry from the destination catalogue that they want to keep track of. A Traveler may hold several for the same country, and each will later carry its own visa type and dates. NOT a destination catalogue entry, which is shared by every Traveler, and NOT a trip or stay, which has dates. |
| Destination catalogue | The fixed set of countries and zones the app supports — five this pass (Schengen, Thailand, Vietnam, Malaysia, Indonesia) — defined in the codebase and identical for every Traveler. In this SAD it is a frozen constant compiled into both containers, not a table and not a container (ADR-0006). |
| Detail view | The view of a single tracked destination, reached by opening it from the list and addressable in its own right so it can be reloaded, bookmarked and returned to. NOT a pane that swaps in place without its own address — that addressability is what the reload, bookmark and not-yours guarantees rest on. |
| First-run screen | The screen a Traveler with no tracked destinations lands on: a screen of its own, with no list beside it, whose single action adds their first destination. NOT the empty state of the list view — the list is absent there, not merely empty. Reachable only from a *confirmed* empty read, never from a failed one. |
| Saved address | The address of a tracked destination's detail view, carrying that destination's identifier, which a Traveler can reload, bookmark or share. In this SAD it is `/dashboard/<trackedDestinationId>` (ADR-0002). NOT remembered client-side state — the open destination is named in the address, which is why an address naming another Traveler's destination is an authorization case, not a display case. |
| Sign-in session | The period a Traveler is authenticated, bounded by sign-in and sign-out or by the provider's session expiring. For client-side in-memory state such as the query cache, it is additionally bounded by the current page load. NOT a single page load — the underlying authentication outlives a reload; only in-memory state resets. |
| Destination reference | The permanent identifier of a destination catalogue entry, stored on a tracked destination as a text column. Never reused for anything else and never removed once any Traveler could hold one, so a delisted destination stays fully openable and removable and is simply no longer addable (AC-09, ADR-0006). |
| Plain home address | `/dashboard` — the list with nothing selected. What a rejected saved address is replaced with, so a reload does not repeat the rejection (AC-06). |
| Confirmed | Said of a change the system has actually recorded and reported back. The list reflects only confirmed changes: nothing appears or disappears optimistically (ADR-0005). Also said of a read — the first-run screen requires a *confirmed* empty read — and of a sign-out, which is what triggers discarding the cache (ADR-0007). |
| Overlay surface | Any of the three surfaces this feature opens over the content: the narrow-screen list drawer, the add picker and the removal confirmation. All three share one focus contract through a single `Modal` primitive (ADR-0004). |
| Blast radius | How painful a decision is to reverse later. The gate deciding which decisions in this SAD became ADRs: irreversible, multi-module, or having legitimate alternatives — two of three. |

