---
id: T14
title: "Build SCR-04 Magic-link invalid screen, all 3 states"
layer: "ui"
deps: ["T11"]
acs: ["AC-02"]
files_hint: ["src/modules/auth/ui/magic-link-invalid/"]
owner: "Frontend Lead"
estimate: "S"
status: "todo"
---

# T14 — Build SCR-04 Magic-link invalid screen, all 3 states

## Why

[screens.md SCR-04](../screens.md) is the canonical manifest for [AC-02](../spec.md): an expired, already-used, or superseded magic-link is blocked, with an offer to send a new one.

## What

Compose `Alert`, `Button` ("Send a new link"), `Spinner` (T11) into the 3 states SCR-04 specifies: `default`, `loading`, `error-rate-limited`.

## Definition of Done

- [ ] component test for each of the 3 states matches [screens.md SCR-04](../screens.md)'s wireframe content
- [ ] `error-rate-limited` shares its rendering with SCR-02's equivalent state (same underlying error code)
- [ ] lint + vet clean
