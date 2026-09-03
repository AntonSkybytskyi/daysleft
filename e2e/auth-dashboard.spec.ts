import { expect, test } from "@playwright/test";

// Every scenario below needs a live Clerk instance. This repo has no registered Clerk
// application in this environment — only a syntactically-valid placeholder publishable/secret
// key pair (.env.local, so `pnpm build`/`pnpm start` don't crash on a missing key). Any page that
// mounts ClerkProvider or a Clerk hook (login, dashboard-when-unauthenticated via the middleware)
// triggers Clerk's client-side "dev browser" handshake against the real Clerk backend to
// establish a session context — confirmed by running this suite here: it redirects off-app to
// `https://<host>.clerk.accounts.dev/v1/client/handshake` and hangs/errors with no network route
// to a real Clerk instance, before any of our own page content renders. There is no supported way
// to run a page through ClerkProvider without a real (or Clerk-mocked) backend to talk to.
//
// Each test below has a REAL body — real navigation, real assertions against the actual UI this
// feature ships — and is skipped with a named, visible reason (via test.skip(condition, reason)
// inside the test, not an empty test.skip stub) when E2E_HAS_LIVE_CLERK is unset. Point it at a
// Clerk test instance wired for Clerk's testing-token harness
// (https://clerk.com/docs/testing/playwright) to actually run these; CI never claims coverage it
// doesn't have. This is the same NON-red posture as the Docker-less Postgres integration tests
// (T1, T3): run real coverage when the external dependency is reachable, report NON-red honestly
// when it isn't, never fake a pass.
//
// The underlying logic each scenario exercises is separately proven at a layer that doesn't need
// a live Clerk instance: return-to origin validation and the default-dashboard fallback (T9/T18,
// src/modules/auth/app/return-to.test.ts), the login shell's English-fallback translate()
// resolution (T10/T25, src/lib/i18n/translate.test.ts), the account-linking-by-verified-email
// invariant and the create-or-fetch fallback (T2/T6), the empty-state dashboard shell (T15,
// DashboardScreen.test.tsx), the /sso-callback completion + failure branches (T19/T21/T22,
// SsoCallbackContainer.test.tsx), and the full QG-1 security scenarios end to end (T16,
// tests/integration/auth/qg1-security.test.ts).

const hasLiveClerk = Boolean(process.env.E2E_HAS_LIVE_CLERK);
const skipReason =
  "needs a live Clerk instance wired for Clerk's testing-token harness — E2E_HAS_LIVE_CLERK is unset in this environment";

test.describe("auth-user-plus-dashboard", () => {
  test("an unauthenticated dashboard visit redirects to login and preserves return-to (AC-04, AC-05)", async ({
    page,
  }) => {
    test.skip(!hasLiveClerk, skipReason);

    await page.goto("/dashboard/trips/123");
    await page.waitForURL(/\/login\?return_to=/);
    expect(new URL(page.url()).searchParams.get("return_to")).toBe("/dashboard/trips/123");
    await expect(page.getByRole("status")).toHaveText(/sign in to continue/i);
  });

  test("the login shell falls back to English for an unsupported browser locale (AC-08)", async ({ browser }) => {
    test.skip(!hasLiveClerk, skipReason);

    const context = await browser.newContext({ locale: "fr-FR" });
    const page = await context.newPage();
    try {
      await page.goto("/login");
      await expect(page.getByRole("heading", { name: "Sign in to daysleft" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Send magic link" })).toBeVisible();
    } finally {
      await context.close();
    }
  });

  // AC-01 (reaching the dashboard) and AC-07 (the empty-state dashboard) are NOT covered
  // end-to-end by this scenario: completing the magic-link verification itself needs Clerk's
  // testing-token harness (https://clerk.com/docs/testing/playwright) to retrieve and follow the
  // emailed link without a real inbox, which this environment doesn't have wired (no live Clerk
  // test instance, no CI secrets for one). Wiring that harness is out of scope for this pass — see
  // the T47 follow-up in docs/features/auth-user-plus-dashboard/tasks/tracker.md. Rather than wait
  // on a URL nothing in this test drives it to, this scenario stops at the one step it can
  // actually prove: the magic-link send reaches /check-email. AC-01/AC-07 e2e-through-UI coverage
  // is explicitly recorded as absent here (test-plan.md requires it); both are covered at the
  // component/integration level instead — DashboardScreen.test.tsx (empty state),
  // SsoCallbackContainer.test.tsx (magic-link completion branches), and
  // tests/integration/auth/qg1-security.test.tsx (account resolution end to end).
  test("magic-link send reaches /check-email with the submitted address shown (part of AC-01's flow)", async ({
    page,
  }) => {
    test.skip(!hasLiveClerk, skipReason);

    const uniqueEmail = `traveler+${Date.now()}@example.test`;

    await page.goto("/login");
    await page.getByLabel("Email").fill(uniqueEmail);
    await page.getByRole("button", { name: "Send magic link" }).click();
    await page.waitForURL(/\/check-email/);
    await expect(page.getByText(new RegExp(uniqueEmail.replace("+", "\\+")))).toBeVisible();
  });
});
