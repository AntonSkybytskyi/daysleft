---
status: Accepted
owner: "Architect / Tech Lead"
reviewers: []
updated_at: "2026-09-02"
feature_size: "L"
ticket: "auth-user-plus-dashboard"
---

# 0001 — Use Clerk for passwordless auth

- **Status:** Accepted
- **Date:** 2026-09-02
- **Deciders:** Architect + user (design Socratic walk)

## Context

daysleft's first user-facing slice needs passwordless authentication — Google OAuth, GitHub OAuth, and magic-link email — with account-linking by verified email and full server-side session revocation on logout (spec AC-01 through AC-06). `architecture-map.md` had provisionally named Auth.js/NextAuth, but the user flagged a preference for a hosted service during `specify` (spec §8 open question), to be resolved here.

## Decision drivers

- Full server-side session revocation on logout, not just a client cookie clear (spec AC-06, §6.1 abuse case "stale session survives logout")
- Account-linking by verified email — one account regardless of sign-in method (spec AC-03)
- Security review is required either way (spec §6.1: first auth boundary, first PII collection) — minimizing hand-rolled auth surface reduces that review's scope
- Time-to-ship favors not hand-writing OAuth callback/token handling for a first auth boundary

## Considered options

1. **Auth.js / NextAuth v5** — self-hosted auth library with a Drizzle adapter, sessions live in our own Postgres.
2. **Supabase Auth** — hosted auth built on Postgres; composes with our existing Drizzle/Postgres stack if we adopt Supabase-hosted Postgres.
3. **Clerk** — fully hosted auth service with its own user/session store, pre-built UI components, webhook-based sync to a local shadow table.
4. **Roll our own** — hand-written OAuth + magic-link token issuance/verification, no library.

## Decision outcome

**Chosen:** Option 3, Clerk. It removes the OAuth callback/token/session-revocation surface from our own code entirely — Clerk holds the source of truth for accounts and sessions and exposes a Backend API to revoke a session server-side, satisfying AC-06 without us building revocation logic. It ships pre-built login/magic-link UI, reducing the amount of first-time auth code subject to the mandatory security review (spec §6.1). daysleft's own Postgres stays free of Auth.js/Supabase-specific auth tables; instead a local shadow `users` row (Clerk user id + verified email) is synced via Clerk webhooks so `trips`/`rules` (future features) can foreign-key to a local id.

## Consequences

**Positive**
- No OAuth/session/token code to write or security-review ourselves — Clerk owns that surface.
- Server-side logout (AC-06) is a call to Clerk's Backend API, not custom revocation logic.
- Pre-built login/magic-link UI components speed up the SCR-01/SCR-02/SCR-04 screens.
- Account-linking by verified email (AC-03) is Clerk's built-in behavior.

**Negative**
- A new external dependency + a vendor cost curve independent of our Postgres hosting choice (unlike Supabase Auth, which would have ridden on Postgres hosting).
- Our own Postgres is NOT the source of truth for identity — a webhook-sync path (Clerk → our `users` shadow table) is now required infrastructure, with its own failure-mode (a missed/delayed webhook leaves the shadow table stale).
- Outage or incident on Clerk's side directly affects our login/dashboard availability (99.5% SLO, spec §6) — this is now a dependency we don't control.

**Neutral**
- Switching to a self-hosted library later (Auth.js/Supabase Auth) is possible but requires migrating every existing account's credentials/sessions — a real, if not urgent, migration cost.

## Links

- Spec: [[../spec.md]]
- SAD: [[../sad.md]] §4
- Related ADR: (none yet)
