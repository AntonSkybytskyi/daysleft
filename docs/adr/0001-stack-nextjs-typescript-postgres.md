---
status: Accepted
date: 2026-09-02
---

# 0001 — Stack: Next.js + TypeScript + PostgreSQL

## Context

daysleft needs an offline-first web app (installable, usable without network) backed by
cloud accounts so day-count data (Schengen 90/180, Vietnam, Thailand DTV rules) syncs across
devices. The user wants one team/codebase to own both UI and API, in TypeScript.

## Decision drivers

- Single language across frontend + backend (solo/small team)
- Mature offline/PWA tooling
- Relational data (users, trips, stays) with straightforward migrations
- Fast path to shipping v1

## Considered options

- **Next.js (App Router) + TypeScript + PostgreSQL, API routes co-located** — chosen
- SvelteKit + TypeScript + PostgreSQL — leaner, smaller ecosystem for offline/PWA tooling
- Separate Node.js API + React SPA — more moving parts, no benefit given co-located API routes suffice

## Outcome

Adopt Next.js (App Router) with TypeScript for both the offline-first PWA frontend and the
API routes, PostgreSQL as the relational datastore.

## Consequences

- Good: one deploy unit, one language, large ecosystem for PWA/offline (service workers, Dexie)
- Good: API routes co-located simplifies auth/session sharing between UI and API
- Bad: Next.js API routes are less flexible than a standalone API service if daysleft later needs
  independent scaling or a non-web client (mobile) — would require extracting an API service
- Bad: couples frontend and backend deploy lifecycle
