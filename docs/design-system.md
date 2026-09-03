---
status: Living
tool: code               # figma | pencil | code — the single committed source of the design-tool choice (never sdd.local.md: that file is per-developer + gitignored)
figma_file: ""           # tool: figma → the Figma file URL/key the canon lives in; else ""
pen_file: ""             # tool: pencil → the .pen library path (e.g. docs/design/library.pen); else ""
updated_at: "2026-09-02"
---

# Design system — daysleft

> The project's **design canon**, produced once per repo by `design-system` and read by
> `ux-flows` / `screens` / `implement` / `review`. Committed — the tool choice and the inventory
> are team-wide, not per-developer. `architecture-map.md` §Frontend / UI foundation stays the
> inventory of the **code**; this file is the **design-side** canon (tool, posture, tokens,
> component inventory, cross-screen conventions). Refresh via `/sdd:design-system` when the
> foundation changes.

## Platform posture

- **Posture:** responsive-both — daysleft is used both on-the-go (checking days-left while traveling) and for planning ahead (reviewing trip history, setting up rules) at a desk; no single device dominates.
- **Breakpoints / device classes:** Tailwind defaults (`sm` 640px / `md` 768px / `lg` 1024px / `xl` 1280px) — no custom breakpoints yet, revisit once screens exist.

## Design tool

- **Tool:** code — no Figma/Pencil MCP connected this session; markdown wireframes in each feature's `screens.md` need no tool and never block the pipeline.
- **Library location:** the in-repo components (`src/modules/ui/`) are the library — no external file.

## Token source

- **Colors:** Tailwind config — `tailwind.config.ts` (not yet created; `scaffold` materializes it, canon points here as the source of truth)
- **Spacing / sizing:** Tailwind config — `tailwind.config.ts` (Tailwind defaults until a feature proves the need to extend)
- **Typography:** Tailwind config — `tailwind.config.ts` (Tailwind defaults until a feature proves the need to extend)

## Component inventory

Established by `auth-user-plus-dashboard` (first UI feature), `src/modules/ui/`:

| Component | Source | States it supports | Notes |
|---|---|---|---|
| `Button` | `src/modules/ui/Button/Button.tsx` | primary, secondary, loading, disabled | generic action button; loading disables the button and shows `Spinner` |
| `LinkButton` | `src/modules/ui/LinkButton/LinkButton.tsx` | default, loading | text-styled inline action (e.g. "Resend") |
| `OAuthProviderButton` | `src/modules/ui/OAuthProviderButton/OAuthProviderButton.tsx` | google, github, loading | provider-branded button, full width |
| `EmailInput` | `src/modules/ui/EmailInput/EmailInput.tsx` | default, error | labeled email field, `aria-invalid` + associated error text |
| `Alert` | `src/modules/ui/Alert/Alert.tsx` | info (`role=status`), success (`role=status`), error (`role=alert`) | inline banner |
| `Spinner` | `src/modules/ui/Spinner/Spinner.tsx` | standalone, embedded | `role=status`; embedding components override the host's `aria-label` so it doesn't leak "Loading" into the button's accessible name |
| `Header` | `src/modules/ui/Header/Header.tsx` | with/without logout action | app-shell header, composes `Button` |
| `EmptyState` | `src/modules/ui/EmptyState/EmptyState.tsx` | default | heading + body message |

## Interaction & writing conventions

Set by `auth-user-plus-dashboard` (first UI feature):

- **Errors:** `Alert` with `variant="error"` (`role=alert`, assertive); inline field errors via `EmailInput`'s `error` prop (`aria-invalid` + adjacent message)
- **Empty states:** `EmptyState` — a heading plus a one-line body, no illustration
- **Loading:** the acting control itself shows `Spinner` and disables (`Button`/`LinkButton`/`OAuthProviderButton`'s `loading` prop) — no full-page spinners for in-place actions
- **Validation:** inline, on the field itself (`EmailInput`), not deferred to a summary block
- **Microcopy tone:** direct and short (e.g. "Sign-in didn't complete. Try again with any method below."); see `src/lib/i18n/en.json` for the extracted strings
