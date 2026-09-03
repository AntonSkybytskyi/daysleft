---
id: T2
title: "Implement the account-linking-by-verified-email invariant as a pure function"
layer: "domain"
deps: []
acs: ["AC-03", "AC-03b"]
files_hint: ["src/modules/auth/app/account-linking.ts"]
owner: "Backend Lead"
estimate: "S"
status: "todo"
---

# T2 — Implement the account-linking-by-verified-email invariant as a pure function

## Why

Derives from [spec AC-03/AC-03b](../spec.md) and [sad.md §4 building block 2](../sad.md): one person must never end up with two accounts regardless of sign-in method, and an OAuth provider that returns no verified email must never create or link an account.

## What

A pure function taking a Clerk webhook payload's `email_addresses` (see [openapi.yaml `ClerkWebhookEvent`](../contracts/openapi.yaml)) and returning either the verified email to link/create by, or a typed rejection when no `verification.status: verified` entry exists. No I/O — this is the invariant only, consumed by T5's webhook handler and T3's repository call.

## Definition of Done

- [ ] unit test: a payload with one verified email address returns that email
- [ ] unit test: a payload with only unverified email addresses returns the rejection case (AC-03b)
- [ ] unit test: a payload with multiple email addresses, one verified, returns the verified one
- [ ] lint + vet clean

## Notes

Keep this free of Clerk SDK types beyond the webhook payload shape already in the contract — it should be testable without mocking Clerk or the database.
