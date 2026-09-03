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
  matcher: ["/dashboard/:path*", "/login", "/api/v1/dashboard", "/api/v1/auth/logout"],
};
