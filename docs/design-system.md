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
- **Library location:** the in-repo components (`src/modules/ui/`, once established) are the library — no external file.

## Token source

- **Colors:** Tailwind config — `tailwind.config.ts` (not yet created; `scaffold` materializes it, canon points here as the source of truth)
- **Spacing / sizing:** Tailwind config — `tailwind.config.ts` (Tailwind defaults until a feature proves the need to extend)
- **Typography:** Tailwind config — `tailwind.config.ts` (Tailwind defaults until a feature proves the need to extend)

## Component inventory

<!-- empty — greenfield, no UI code yet. `implement` registers components here as the first UI feature builds them. -->

| Component | Source (`file:line` / node / URL) | States it supports | Notes |
|---|---|---|---|
| — | — | — | none yet; first UI feature establishes the initial set in `src/modules/ui/` |

## Interaction & writing conventions

<!-- no UI feature built yet — first UI feature (auth-user-plus-dashboard) sets these precedents; refresh this section once it lands. -->

- **Errors:** TBD — set by the first UI feature
- **Empty states:** TBD — set by the first UI feature
- **Loading:** TBD — set by the first UI feature
- **Validation:** TBD — set by the first UI feature
- **Microcopy tone:** TBD — set by the first UI feature
