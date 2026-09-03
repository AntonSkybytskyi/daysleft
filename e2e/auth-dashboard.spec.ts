import { test } from "@playwright/test";

// NON-red: every scenario below needs a live Clerk instance. This repo has no registered Clerk
// application in this environment — only a syntactically-valid placeholder publishable/secret
// key pair (.env.local, so `pnpm build`/`pnpm start` don't crash on a missing key). Any page that
// mounts ClerkProvider or a Clerk hook (login, dashboard-when-unauthenticated via the middleware)
// triggers Clerk's client-side "dev browser" handshake against the real Clerk backend to
// establish a session context — confirmed by running this suite here: it redirects off-app to
// `https://<host>.clerk.accounts.dev/v1/client/handshake` and hangs/errors with no network route
// to a real Clerk instance, before any of our own page content renders. There is no supported way
// to run a page through ClerkProvider without a real (or Clerk-mocked) backend to talk to.
//
// require_integration: auto — same NON-red posture as the Docker-less Postgres integration tests
// (T1, T3): the policy is to run real coverage when the external dependency is reachable and
// report NON-red honestly when it isn't, never fake a pass.
//
// The underlying logic each scenario would exercise is proven at a layer that doesn't need a live
// Clerk instance: return-to validation and the default-dashboard fallback (T9,
// src/modules/dashboard/app/return-to.test.ts), the login shell's English-fallback translate()
// resolution (T10, src/lib/i18n/translate.test.ts, and LoginScreen's heading prop), the
// account-linking-by-verified-email invariant and the create-or-fetch fallback (T2/T6), the
// empty-state dashboard shell (T15, DashboardScreen.test.tsx), and the full QG-1 security
// scenarios end to end (T16, tests/integration/auth/qg1-security.test.ts).

test.describe("auth-user-plus-dashboard", () => {
  test.skip(
    "an unauthenticated dashboard visit redirects to login and preserves return-to (AC-04, AC-05)",
    () => {},
  );

  test.skip("the login shell falls back to English for an unsupported browser locale (AC-08)", () => {});

  test.skip(
    "sign-up reaches the dashboard, and a fresh account sees the empty-state dashboard (AC-01, AC-07)",
    () => {},
  );
});
