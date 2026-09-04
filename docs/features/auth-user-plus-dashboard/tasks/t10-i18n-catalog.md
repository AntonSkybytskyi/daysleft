---
id: T10
title: "Build the i18n message catalog and translate() helper"
layer: "infra"
deps: []
acs: ["AC-08"]
files_hint: ["src/lib/i18n/en.json", "src/lib/i18n/translate.ts"]
owner: "Backend Lead"
estimate: "S"
status: "todo"
---

# T10 — Build the i18n message catalog and translate() helper

## Why

[sad.md §8 Internationalisation](../sad.md) and [AC-08](../spec.md): ship the minimal i18n plumbing now (message catalog + string extraction) so later localization is additive, without locale-prefixed routing or date/number/currency formatting (spec §3 non-goals).

## What

`src/lib/i18n/en.json` holding every user-facing string this feature's screens need (T11–T15 pull from it, none hardcode English inline); `translate(key)` reads the browser's `Accept-Language`, falls back to English when unsupported.

## Definition of Done

- [ ] unit test: `translate(key)` resolves the English string for a supported locale
- [ ] unit test: `translate(key)` falls back to English for an unsupported/missing locale
- [ ] `en.json` has an entry for every string used across SCR-01–04 and SCR-03
- [ ] lint + vet clean

## Notes

No dependencies — starts immediately. T11 depends on this catalog existing so UI primitives never hardcode strings.
