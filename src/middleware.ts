import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { resolveReturnTo } from "@/modules/auth/app/return-to";
import { DASHBOARD_PATH } from "@/modules/dashboard/app/get-dashboard";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  if (!isProtectedRoute(request)) {
    return;
  }

  const { userId } = await auth();
  if (userId) {
    return;
  }

  const origin = request.nextUrl.origin;
  const returnTo = resolveReturnTo(request.nextUrl.pathname + request.nextUrl.search, origin, DASHBOARD_PATH);
  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set("return_to", returnTo);
  return NextResponse.redirect(loginUrl);
});

export const config = {
  // Clerk's documented matcher recommendation (https://clerk.com/docs/references/nextjs/clerk-middleware)
  // is a broad catch-all excluding only static assets, run on every route so Clerk's
  // authentication context is initialized before client-side hooks (useClerk/useSignIn/useSignUp)
  // mount. This app instead uses a narrow allowlist; /sso-callback and /check-email both mount
  // Clerk client hooks (SsoCallbackContainer, CheckEmailContainer) and must be included here for
  // the same reason /login is, even though neither is itself an `isProtectedRoute`.
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/sso-callback",
    "/check-email",
    "/api/v1/dashboard",
    "/api/v1/auth/logout",
    "/api/v1/destinations",
    "/api/v1/destinations/:path*",
  ],
};
