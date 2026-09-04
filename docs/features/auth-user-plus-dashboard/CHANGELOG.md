# Changelog — auth-user-plus-dashboard

## auth-user-plus-dashboard — passwordless auth + session-gated dashboard shell

**What:** Travelers can create an account and sign in with Google, GitHub, or a magic-link email —
no password, ever. The same verified email always resolves to one account regardless of which
method was used. `/dashboard` is session-gated: an unauthenticated visitor is bounced to `/login`
and returned to the page they asked for once they sign in. Logout ends the session server-side on
that browser (not just a client cookie clear). The dashboard itself ships as an empty-state shell
("nothing tracked yet") for future trip/rule features to populate. A minimal i18n foundation
(message catalog + `t()` helper, English populated) ships alongside so future locales are additive.

**Why:** This is the first user-facing vertical slice of daysleft — every subsequent feature
(trips, Schengen/Vietnam/Thailand rules) assumes a signed-in Traveler and a working dashboard
shell. See [spec](../spec.md) §1/§2. Key decision: [ADR-0001](../adr/0001-use-clerk-for-passwordless-auth.md)
(Clerk for passwordless auth — closes the two-accounts-per-email and open-redirect failure modes
by design).

**How to use:** Visit `/login`, choose Google, GitHub, or email; a magic link opens `/check-email`
then completes via `/sso-callback`. See [openapi.yaml](../contracts/openapi.yaml) for the
webhook/session endpoints.

**Operational notes:**
- Migration: `0000_panoramic_paladin` (users table) + `0001_add_linked_identities` (verified-email
  account-linking table) — both apply cleanly on deploy and revert cleanly via
  `drizzle/0000_panoramic_paladin.down.sql` / `drizzle/0001_add_linked_identities.down.sql`.
- Feature flag / config: requires `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`,
  `CLERK_WEBHOOK_SECRET`, `DATABASE_URL` set in the deploy environment.
- Rollback: `pnpm db:down` (twice, to revert both migrations) + revert the deploy.

**Acceptance criteria delivered:** AC-01, AC-01b, AC-02, AC-02b (returning-Traveler branch; see
known issues below), AC-03, AC-03b, AC-04, AC-05, AC-06 (see known issues below), AC-07, AC-08.

**Known issues shipped (round-7 review, deferred by explicit user decision — see spec.md §8):**
- `MagicLinkInvalidScreen`'s "verified elsewhere" copy still claims a confirmed session on the
  other device when it shouldn't (`en.json` catalog string not updated to match the corrected
  component default).
- Dashboard logout-retry exhaustion shows a false "you're still signed in" message and its retry
  CTA re-POSTs a logout that now 401s — an unrecoverable dead end for that one edge case.
- Two round-7 tests (`DashboardContainer.test.tsx` backoff assertion,
  `CheckEmailContainer.test.tsx` unmount-during-resend) are tautologies — they pass regardless of
  whether the fix they claim to prove exists. The underlying fixes are real; only the proof is
  missing.
- AC-02b's sign-up sub-branch (a first-time email opened via magic link on a different device)
  still has no cross-device completion path.

All four owned by Frontend Lead, due on the next pass touching the named file.
