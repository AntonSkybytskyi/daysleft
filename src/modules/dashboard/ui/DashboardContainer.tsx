"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { resolveReturnTo } from "@/modules/auth/app/return-to";
import {
  clearDashboardQuery,
  DashboardSessionInvalidError,
  dashboardQueryOptions,
} from "@/modules/dashboard/app/dashboard-query";
import { DASHBOARD_PATH } from "@/modules/dashboard/app/get-dashboard";
import { DashboardScreen, type DashboardScreenState, type DashboardScreenStrings } from "./DashboardScreen";

export type DashboardContainerProps = {
  strings?: Partial<DashboardScreenStrings>;
};

export function DashboardContainer({ strings }: DashboardContainerProps = {}) {
  const router = useRouter();
  const clerk = useClerk();
  const queryClient = useQueryClient();
  const { user, isLoaded } = useUser();
  // Logout failures are tracked separately from the dashboard query's own status —
  // a failed logout must keep showing its own error regardless of what the query is doing.
  const [status, setStatus] = useState<"idle" | "error-logout-failed">("idle");
  // Once the server confirms logout, this query must stay disabled even if a later render
  // (e.g. a failed clerk.signOut() retry surfacing its own error) happens afterward — otherwise
  // TanStack Query would notice the cache entry we just cleared is gone and auto-refetch it.
  const [sessionCleared, setSessionCleared] = useState(false);

  const enabled = isLoaded && Boolean(user) && !sessionCleared;
  const query = useQuery({
    ...dashboardQueryOptions(user?.id ?? ""),
    enabled,
  });

  const sessionInvalidError = query.error instanceof DashboardSessionInvalidError ? query.error : undefined;

  useEffect(() => {
    if (sessionInvalidError) {
      router.replace(sessionInvalidError.loginUrl);
    }
  }, [sessionInvalidError, router]);

  // Clerk's user can go null while this container stays mounted (session revoked from
  // another device, token-refresh failure, sign-out in another tab). `sessionCleared` is
  // excluded because handleLogout already owns that redirect. Without this, `enabled` would
  // stay false forever, no fetch would ever run, and an already-rendered dashboard would be
  // stuck on the loading spinner instead of AC-03's redirect.
  const sessionLost = isLoaded && !user && !sessionCleared;
  useEffect(() => {
    if (sessionLost) {
      const path = `${window.location.pathname}${window.location.search}`;
      const returnTo = resolveReturnTo(path, window.location.origin, DASHBOARD_PATH);
      router.replace(`/login?return_to=${encodeURIComponent(returnTo)}`);
    }
  }, [sessionLost, router]);

  // A confirmed invalid session redirects away — never render dashboard data or the
  // generic error state while that navigation is in flight.
  //
  // A retry re-fetch of a query with no cached data resets TanStack Query's `status` back to
  // "pending" for its duration (query.js's fetchState clears status/error when data is
  // undefined), so `isPending`/`isError` alone can't tell a first-ever load apart from a retry
  // in flight. `errorUpdateCount` persists across that reset, so it's what keeps the error +
  // retry button on screen (instead of falling back to the full-page spinner) while retrying.
  const dashboardStatus: DashboardScreenState = !enabled || sessionInvalidError
    ? "loading"
    : query.isSuccess
      ? "default"
      : query.isError || query.errorUpdateCount > 0
        ? "error"
        : "loading";

  const renderStatus: DashboardScreenState = status === "error-logout-failed" ? status : dashboardStatus;

  // Once shown, the linked confirmation must survive a later fetch (e.g. an AC-02 retry)
  // whose response no longer carries linked:true — it's a durable fact about this sign-in
  // session, not a live reflection of the most recent response.
  const [linked, setLinked] = useState(false);
  useEffect(() => {
    if (query.data?.linked) {
      setLinked(true);
    }
  }, [query.data?.linked]);

  const handleLogout = async () => {
    let response: Response;
    try {
      response = await fetch("/api/v1/auth/logout", { method: "POST" });
    } catch {
      setStatus("error-logout-failed");
      return;
    }
    if (response.status !== 204) {
      // The Clerk session may still be live — never tell the Traveler they're signed out
      // when the server didn't actually revoke it.
      setStatus("error-logout-failed");
      return;
    }
    // The server confirmed the session is gone — clear this Traveler's cache entry right away,
    // independent of whatever happens to the client-side signOut() below, so a next Traveler
    // signing in on this device never reads a previous Traveler's cached dashboard data.
    if (user?.id) {
      clearDashboardQuery(queryClient, user.id);
    }
    setSessionCleared(true);
    // The server already revoked the session — that's authoritative, so a rejection here
    // never re-POSTs the logout endpoint (it now 401s with no server session left). Instead
    // retry signOut() itself a bounded number of times, so a transient client-side blip
    // doesn't leave a live Clerk session behind after we tell the user they're signed out.
    const maxSignOutAttempts = 3;
    const retryBackoffMs = 300;
    for (let attempt = 1; attempt <= maxSignOutAttempts; attempt += 1) {
      try {
        await clerk.signOut();
        router.replace("/login");
        return;
      } catch {
        if (attempt < maxSignOutAttempts) {
          // A back-to-back retry gives a transient blip no real chance to clear; a short
          // wait between attempts does.
          await new Promise((resolve) => setTimeout(resolve, retryBackoffMs));
        }
      }
    }
    // Every attempt failed — the client may still hold a live session. Redirecting here would
    // falsely tell the Traveler they're signed out, so surface a failure instead of an
    // optimistic redirect (the server-side session is already gone; only the client-side one
    // is in doubt, so nothing more to retry on the server).
    setStatus("error-logout-failed");
  };

  return (
    <DashboardScreen
      state={renderStatus}
      onLogout={handleLogout}
      onRetry={() => query.refetch()}
      isRetrying={query.isFetching}
      linked={linked}
      strings={strings}
    />
  );
}
