---
slug: dashboard-countries-list
date: 2026-09-07
triage: regression
acs: [AC-12]
commit: 708f6a9
recurrence_of: none
---

# Fix: replace the jest-axe dependency with vitest-axe

## Symptom

Not a behavioral bug: an explicit user request to remove the `jest-axe` dependency. `jest-axe`
was live in 5 test files — `src/modules/ui/Modal/Modal.test.tsx`,
`src/modules/destinations/quality.test.tsx`, `DestinationListDrawer.test.tsx`,
`DestinationPicker.test.tsx`, `RemoveConfirmation.test.tsx` — plus the shared Vitest setup
(`src/test/setup-vitest.ts`), used for `expect(await axe(container)).toHaveNoViolations()`
assertions. Confirmed with the user: the goal is to keep every existing accessibility assertion
working, swapped onto `vitest-axe` (a native-Vitest fork of the same `axe-core` engine) rather
than dropping a11y coverage.

Because there was no incorrect behavior to reproduce, this record replaces the usual RED
(failing-test) pin with a before/after full-suite-green comparison (below) — that is the
deviation from this skill's normal TDD loop, made explicit here rather than silently.

## Root cause

N/A — no defect. `jest-axe` was introduced at scaffold time (`49db576`), predates this feature,
and is shared test infrastructure, not something dashboard-countries-list's own spec pins to that
package name — `spec.md` and `test-plan.md` (AC-12, its "overlay accessibility & focus" test-plan
row) both specify the requirement generically ("an automated accessibility check", "`axe-core`
runs alongside… as part of the same suite"), naming the underlying engine, never the wrapper
package. Swapping the wrapper therefore doesn't touch what AC-12 guarantees.

One real snag surfaced during the swap: `vitest-axe@0.1.0` (latest tagged "stable" on npm) ships
a broken package — its root `matchers.d.ts` re-exports `toHaveNoViolations` as `export type *`,
so TypeScript refuses to import it as a value (`TS1362`) under this repo's `isolatedModules`, and
its `dist/extend-expect.js` is a 0-byte file, so the ambient Vitest-matcher type augmentation
(`declare module "vitest"`) is present in `.d.ts` but never actually registers the matcher.
`vitest-axe@1.0.0-pre.5` fixes both — a real `exports` map, a populated `extend-expect.js` that
self-registers via `expect.extend(...)`, and a `declare module "vitest"` augmentation matching
Vitest 2.x's actual typing surface (`peerDependencies.vitest: ">=1"`, matching this repo's `^2.0.5`)
— so that's the version pinned.

## The pinning test

No RED/GREEN pin — there was no bug. Verification instead: `pnpm test` was green (317/317, 60
files) immediately before the swap (during the `sdd:ship` verification pass earlier this
session) and is green again after (317/317, 60 files, same suite), and `pnpm lint`
(`eslint . && tsc --noEmit`) is clean after the swap — confirming the `toHaveNoViolations`
assertions in all 5 test files still execute and pass under `vitest-axe`, with no type-checking
regressions from the matcher augmentation.

## Spec patch

None — AC-12 re-verified as still satisfied; it was already tool-agnostic (names `axe-core`, not
`jest-axe`), so the wrapper swap needed no wording change.

## Follow-ups

- `vitest-axe` is pinned at a prerelease (`1.0.0-pre.5`) because it is the first version with a
  working `exports` map and Vitest 2.x-compatible matcher types; revisit the pin once a stable
  `1.0.0` ships.
- `package.json`'s devDependency ended up in the `dashboard-countries-list` feature's commit
  history for lack of a better owner — it's shared test infra, not feature-scoped; no action
  needed, noted for anyone tracing dependency history later.
