---
id: T16
title: "Write integration tests for the QG-1 security scenarios"
layer: "tests"
deps: ["T5", "T7", "T8", "T9"]
acs: ["AC-03", "AC-06"]
files_hint: ["tests/integration/auth/"]
owner: "Backend Lead"
estimate: "M"
status: "todo"
---

# T16 — Write integration tests for the QG-1 security scenarios

## Why

[sad.md §10 QG-1](../sad.md) names the exact verification this feature's top security quality goal needs, spanning T5 (webhook/account-linking), T7 (dashboard gating), T8 (logout), and T9 (return-to validation).

## What

Integration tests exercising the real stack (webhook handler, dashboard handler, logout handler, return-to validator) end to end, not unit-level mocks:

## Definition of Done

- [ ] two sign-ins with the same verified email via different methods (two webhook events, different provider metadata, same email) resolve to one account, not two rows in `users`
- [ ] a dashboard request after logout on the same session is denied (401), matching T8→T7's handoff
- [ ] an off-origin return-to param is rejected end to end (T9), never followed
- [ ] lint + vet clean
