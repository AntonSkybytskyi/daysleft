---
id: T12
title: "Build SCR-01 Login screen, all 5 states"
layer: "ui"
deps: ["T11"]
acs: ["AC-01", "AC-01b", "AC-03b", "AC-05"]
files_hint: ["src/modules/auth/ui/login/"]
owner: "Frontend Lead"
estimate: "M"
status: "todo"
---

# T12 — Build SCR-01 Login screen, all 5 states

## Why

[screens.md SCR-01](../screens.md) is the canonical manifest for this screen; it covers [AC-01](../spec.md) (happy path sign-up/sign-in), [AC-01b](../spec.md) (OAuth failure), [AC-03b](../spec.md) (no verified email), and [AC-05](../spec.md) (redirected here when unauthenticated).

## What

Compose `OAuthProviderButton` ×2, `EmailInput`, `Button`, `Alert`, `Spinner` (T11) into the 5 states SCR-01 specifies: `default`, `loading`, `error-sign-in-failed`, `error-email-required`, `redirected-sign-in-required`. Wire the OAuth/magic-link initiation to Clerk's hosted flow (per [openapi.yaml](../contracts/openapi.yaml), daysleft's own API is never called to start sign-in).

## Definition of Done

- [ ] component test for each of the 5 states matches [screens.md SCR-01](../screens.md)'s wireframe content
- [ ] `error-email-required` renders on the `auth.email_required` error code (AC-03b)
- [ ] `redirected-sign-in-required` renders when arriving via T9's redirect with `return_to` preserved (AC-05)
- [ ] lint + vet clean
