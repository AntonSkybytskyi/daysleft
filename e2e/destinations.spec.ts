import { expect, test } from "@playwright/test";

// Same NON-red posture as e2e/auth-dashboard.spec.ts: this environment has no live Clerk
// instance, only a placeholder key pair, so any page mounting Clerk hooks (the dashboard, the
// detail address) triggers Clerk's dev-browser handshake against a real backend with no route
// to it here. Each scenario below has a real body and is skipped with a named reason when
// E2E_HAS_LIVE_CLERK is unset — point it at a Clerk test instance
// (https://clerk.com/docs/testing/playwright) to actually run these.
//
// The underlying logic is separately proven without a live Clerk instance: the saved-address
// resolve/fallback and session-routing logic in DestinationsView.test.tsx, the ordering
// equivalence and timing budgets in src/modules/destinations/quality.test.tsx, and every
// use-case/route/component test under src/modules/destinations/.

const hasLiveClerk = Boolean(process.env.E2E_HAS_LIVE_CLERK);
const skipReason =
  "needs a live Clerk instance wired for Clerk's testing-token harness — E2E_HAS_LIVE_CLERK is unset in this environment";

test.describe("dashboard-countries-list", () => {
  test("a reload of a saved detail address reopens the same tracked destination (AC-05)", async ({ page }) => {
    test.skip(!hasLiveClerk, skipReason);

    await page.goto("/dashboard");
    await page.getByRole("button", { name: "+ Add" }).click();
    await page.getByRole("button", { name: "Thailand" }).click();
    await page.waitForURL(/\/dashboard\/[0-9a-f-]+/);
    const detailUrl = page.url();

    await page.reload();

    expect(page.url()).toBe(detailUrl);
    await expect(page.getByRole("heading", { name: "Thailand" })).toBeVisible();
  });

  test("a not-yours/removed/never-existed saved address falls back to the plain home address with one message (AC-06)", async ({
    page,
  }) => {
    test.skip(!hasLiveClerk, skipReason);

    await page.goto("/dashboard/00000000-0000-7000-8000-000000000000");

    await page.waitForURL("/dashboard");
    await expect(page.getByText("That destination isn't available.")).toBeVisible();
  });

  test("an unauthenticated visit to either page redirects to sign-in and returns after success (AC-13)", async ({
    page,
  }) => {
    test.skip(!hasLiveClerk, skipReason);

    await page.goto("/dashboard/00000000-0000-7000-8000-000000000000");
    await page.waitForURL(/\/login\?return_to=/);
    expect(new URL(page.url()).searchParams.get("return_to")).toBe(
      "/dashboard/00000000-0000-7000-8000-000000000000",
    );
  });
});
