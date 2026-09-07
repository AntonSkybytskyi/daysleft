---
status: Accepted
owner: "Tech Lead"
reviewers: ["Tech Lead", "Security Lead"]
updated_at: "2026-09-06"
feature_size: "M"
ticket: "dashboard-countries-list"
---

# 0002 — Address an open tracked destination as a path segment under /dashboard

- **Status:** Accepted
- **Date:** 2026-09-06
- **Deciders:** Tech Lead (during the `design` Socratic walk)

## Context

"Saved address" is a glossary term in this product: the address of a tracked destination's detail view carries that destination's identifier so it can be reloaded, bookmarked and returned to. Four acceptance criteria operate directly on it — reload reopens the same destination, a rejected address is replaced with the plain home address, an unauthenticated visitor is returned to the address they wanted after signing in, and the narrow-screen drawer closes when a destination is opened. The app has no dynamic route segment today and its middleware protects a narrow allowlist rather than a catch-all, so the address shape decides how much of the shipped auth machinery still applies.

## Decision drivers

- Spec §5 AC-05: a reload or a return to the same saved address reopens that tracked destination.
- Spec §5 AC-06: a not-yours, removed or never-existed identifier is replaced with the plain home address so a reload does not repeat it.
- Spec §5 AC-13: an unauthenticated visitor is sent to sign in and returned to the address they were trying to reach.
- SAD §2: `src/middleware.ts` uses a narrow allowlist matcher — any route not listed is unauthenticated.
- SAD §2 (organisational): the app shell ships first and this feature must not churn its territory.

## Considered options

1. **`/dashboard/[trackedDestinationId]`** — a dynamic path segment under the existing home address.
2. **`/dashboard?destination=<id>`** — the open destination as a search parameter on the single home address.
3. **`/destinations/[id]`** — a new top-level resource-named route that becomes the app's home.

## Decision outcome

**Chosen:** Option 1. The existing matcher entry `/dashboard/:path*` already protects the whole subtree, so no page-level middleware change is needed and no window exists where a detail route ships unauthenticated; `resolveReturnTo` already round-trips a path of this shape; and AC-06's replacement is a `router.replace` to `/dashboard`. Option 3 was rejected on sequencing rather than on naming — it is the better name, but moving the home address drags `DASHBOARD_PATH`, the post-login landing and the auth return-to defaults with it, all of which are the app shell's territory.

## Consequences

**Positive**
- Inherits authentication and return-to behaviour from shipped code rather than re-deriving it.
- The detail view is a real route segment, so it can have its own loading and error boundaries later.
- AC-06's "replace the address" is a single router call with no parameter-stripping logic.

**Negative**
- `/dashboard` names a screen where the domain says "tracked destinations"; the address will read slightly wrong until someone renames it.
- The API route `/api/v1/destinations/[id]` must be added to the middleware matcher explicitly — the page-level protection does not extend to it.

**Neutral**
- Renaming the route later is a redirect plus a matcher edit, cheap while the product is pre-launch and there are no real bookmarks to break.

## Links

- Spec: [[../spec.md]] §5 AC-05, AC-06, AC-13
- SAD: [[../sad.md]] §4, §5, §8
- Related ADR: [[0003-give-the-feature-its-own-destinations-module-beside-dashboard]]
