---
id: T6
title: "Clear the identity-scoped cache on server-confirmed logout"
layer: "app"
deps: ["T2", "T3"]
acs: ["AC-05"]
files_hint: ["src/modules/dashboard/app/dashboard-query.ts", "src/modules/dashboard/ui/DashboardContainer.tsx"]
owner: "Frontend Lead"
estimate: "M"
status: "todo"
---

# T6 — Clear the identity-scoped cache on server-confirmed logout

## Why

Derives from [spec AC-05](../spec.md), [sad §6 flow 2](../sad.md), and [ADR-0002](../adr/0002-scope-cache-by-identity-clear-on-logout.md) — the cache must be cleared the moment the logout response confirms the server revoked the session, independent of the client-side sign-out step's own outcome, so a different Traveler signing in afterward can never read it.

## What

`dashboard-query.ts`: export a helper to remove the identity-scoped cache entry. `DashboardContainer.tsx`'s `handleLogout`: call the clear helper as soon as the logout request's response confirms the server-side revocation — before, and independent of, the subsequent `clerk.signOut()` attempt and its retry/failure handling.

## Definition of Done

- [ ] integration test: the cache entry for the logged-out Traveler's identity is removed as soon as the logout response confirms server-side revocation, regardless of whether the client-side sign-out step succeeds or fails
- [ ] integration test: a subsequently-signed-in different Traveler's dashboard fetch never reads the prior Traveler's cache entry
- [ ] lint + vet clean

## Notes

Shares files with T2/T3/T5 — same lane. Does not change the existing `error-logout-failed` UI state.
