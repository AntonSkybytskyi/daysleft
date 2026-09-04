---
id: T13
title: "Build SCR-02 Check your email screen, all 4 states"
layer: "ui"
deps: ["T11"]
acs: ["AC-02b"]
files_hint: ["src/modules/auth/ui/check-email/"]
owner: "Frontend Lead"
estimate: "S"
status: "todo"
---

# T13 — Build SCR-02 Check your email screen, all 4 states

## Why

[screens.md SCR-02](../screens.md) is the canonical manifest; it confirms a magic-link was sent and supports [AC-02b](../spec.md) (completing the link on a different device shows the dashboard directly, no return-to-original-device attempt).

## What

Compose `Alert`, `LinkButton` ("Resend"), `Spinner` (T11) into the 4 states SCR-02 specifies: `default`, `loading`, `resent-confirmation`, `error-rate-limited`.

## Definition of Done

- [ ] component test for each of the 4 states matches [screens.md SCR-02](../screens.md)'s wireframe content
- [ ] `error-rate-limited` renders on the magic-link send-rate error (spec §6 NFR, sad.md §8 risk — surfaced as a distinct error code)
- [ ] lint + vet clean
