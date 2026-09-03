---
id: T11
title: "Build the new shared UI primitives (OAuthProviderButton, EmailInput, Button, LinkButton, Alert, Spinner, Header, EmptyState)"
layer: "ui"
deps: ["T10"]
acs: []
files_hint: ["src/components/ui/", "docs/design-system.md"]
owner: "Frontend Lead"
estimate: "M"
status: "todo"
---

# T11 — Build the new shared UI primitives

## Why

[screens.md "New components"](../screens.md) lists 8 components with no existing primitive to reuse — this is the app's first UI feature, the `docs/design-system.md` inventory is empty. Every SCR-01–04/SCR-03 task (T12–T15) composes these instead of hand-rolling per-screen markup.

## What

Build `OAuthProviderButton` (branded, with a loading variant), `EmailInput` (labeled, inline validation), `Button` (primary/secondary), `LinkButton` (text-styled inline action), `Alert` (info/success/error), `Spinner`, `Header` (carries the logout action), `EmptyState` (illustration + message). Register each in `docs/design-system.md`'s component inventory per [screens.md](../screens.md).

## Definition of Done

- [ ] each of the 8 components has a component test covering its documented states (including loading variants where named in screens.md)
- [ ] every component's copy comes from `translate()` (T10) — no hardcoded English strings
- [ ] `docs/design-system.md` component inventory lists all 8 as registered (no longer "pending")
- [ ] lint + vet clean

## Notes

This is the compile-coupled foundation for T12–T15 — all four screen tasks depend on it and should not start before it lands.
