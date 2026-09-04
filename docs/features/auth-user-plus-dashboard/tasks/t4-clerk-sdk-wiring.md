---
id: T4
title: "Wire the Clerk SDK client and Svix webhook-signature verification helper"
layer: "infra"
deps: []
acs: []
files_hint: ["src/modules/auth/infra/clerk-client.ts", "src/modules/auth/infra/verify-webhook.ts"]
owner: "Backend Lead"
estimate: "S"
status: "todo"
---

# T4 — Wire the Clerk SDK client and Svix webhook-signature verification helper

## Why

[ADR-0001](../adr/0001-use-clerk-for-passwordless-auth.md) makes Clerk the system of record for accounts and sessions; every later task that talks to Clerk (T5 webhook, T6 session helper, T8 logout) needs this client. [openapi.yaml `/webhooks/clerk`](../contracts/openapi.yaml) requires Svix signature verification (`svix-id`/`svix-timestamp`/`svix-signature` headers).

## What

A Clerk SDK client initialized from env config (no secret committed), and a `verifyWebhookSignature(headers, body)` helper wrapping Svix verification, returning a typed valid/invalid result.

## Definition of Done

- [ ] unit test: a validly-signed test payload verifies successfully
- [ ] unit test: a tampered payload or mismatched signature is rejected
- [ ] Clerk secret/keys are read from env, never hardcoded or committed
- [ ] lint + vet clean

## Notes

No dependencies — can start immediately alongside T1/T2/T10.
