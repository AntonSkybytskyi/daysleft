---
id: T5
title: "Implement the Clerk webhook route handler (POST /webhooks/clerk)"
layer: "ports"
deps: ["T3", "T4"]
acs: ["AC-01", "AC-03", "AC-03b"]
files_hint: ["src/modules/auth/infra/routes/clerk-webhook.ts", "src/app/webhooks/clerk/route.ts"]
owner: "Backend Lead"
estimate: "M"
status: "todo"
---

# T5 — Implement the Clerk webhook route handler (POST /webhooks/clerk)

## Why

Implements the [openapi.yaml `handleClerkWebhook`](../contracts/openapi.yaml) operation and [sad.md §6 flows 1/3/4](../sad.md): syncs a Clerk `user.created`/`user.updated` event into the local `users` shadow row.

## What

Route handler: verify Svix signature (T4) → 401 `auth.webhook_invalid_signature` on failure; extract verified email via T2's account-linking function → 422 `auth.email_required` when none exists; otherwise upsert via T3's repository (keyed on Clerk `id`) and return 200 with the `User`. Dedupe redelivery by `svix-id` (per the contract's stated dedupe key).

## Definition of Done

- [ ] integration test: a validly-signed `user.created` event with a verified email upserts and returns 200
- [ ] integration test: an invalid signature returns 401 `auth.webhook_invalid_signature`
- [ ] integration test: a payload with no verified email returns 422 `auth.email_required` and writes no row
- [ ] integration test: redelivering the same `svix-id` does not create a duplicate side effect
- [ ] lint + vet clean

## Notes

Per [sad.md §5](../sad.md), the route handler itself lives under `auth/infra/` by this repo's feature-first convention, with a thin re-export at the Next.js `app/webhooks/clerk/route.ts` path.
