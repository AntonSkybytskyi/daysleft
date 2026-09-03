---
id: T6
title: "Build the session-read helper with the synchronous create-or-fetch fallback"
layer: "app"
deps: ["T3", "T4"]
acs: ["AC-01", "AC-05", "AC-06"]
files_hint: ["src/modules/auth/app/session.ts"]
owner: "Backend Lead"
estimate: "M"
status: "todo"
---

# T6 — Build the session-read helper with the synchronous create-or-fetch fallback

## Why

[sad.md §8 Authentication](../sad.md) requires every protected request to verify the Clerk session server-side. [sad.md §11](../sad.md) flags a Medium risk: a missed/delayed webhook could leave the shadow row stale when a dashboard request arrives first — this task's fallback closes that gap so [AC-01](../spec.md)'s "creates one on first use" doesn't depend solely on webhook timing.

## What

`getSession()` helper: verifies the Clerk session via the SDK (T4); on success, looks up the local `users` row by Clerk id (T3) and creates it synchronously if missing (using the session's own verified email — same invariant as T2); returns a typed result distinguishing valid / no-session / expired-or-invalid.

## Definition of Done

- [ ] integration test: a valid session with an existing shadow row returns it
- [ ] integration test: a valid session with no shadow row yet creates one on the spot and returns it
- [ ] integration test: no session, or an expired/invalid one, returns the unauthenticated result with no user data attached
- [ ] lint + vet clean

## Notes

T7, T8, and T9 all depend on this helper — it is the sole session-verification entry point, so no protected route re-implements Clerk verification itself.
