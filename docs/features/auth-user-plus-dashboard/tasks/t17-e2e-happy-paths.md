---
id: T17
title: "Write e2e tests for the sign-up-to-dashboard and return-to happy paths"
layer: "tests"
deps: ["T12", "T15", "T9", "T10"]
acs: ["AC-01", "AC-04", "AC-05", "AC-07", "AC-08"]
files_hint: ["e2e/auth-dashboard.spec.ts"]
owner: "Frontend Lead"
estimate: "M"
status: "todo"
---

# T17 — Write e2e tests for the sign-up-to-dashboard and return-to happy paths

## Why

Closes the loop on the user-facing ACs that only a full browser flow can verify: [AC-01](../spec.md), [AC-04](../spec.md), [AC-05](../spec.md), [AC-07](../spec.md), [AC-08](../spec.md).

## What

Playwright e2e covering: a fresh sign-up reaching the dashboard (AC-01); an unauthenticated dashboard visit redirecting to login and returning to the originally requested page after sign-in in the same browser (AC-04/AC-05, exercising T9); a fresh account seeing the empty-state dashboard (AC-07); the shell falling back to English for a browser set to an unsupported locale (AC-08).

## Definition of Done

- [ ] e2e: sign-up via a test OAuth/magic-link double reaches the dashboard
- [ ] e2e: visiting `/dashboard` unauthenticated redirects to login, and completing sign-in lands back on `/dashboard`
- [ ] e2e: a fresh account's dashboard shows "Nothing tracked yet"
- [ ] e2e: a browser locale unsupported by `en.json` (T10) still renders English strings
- [ ] lint + vet clean
