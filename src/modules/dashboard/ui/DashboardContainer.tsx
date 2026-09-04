"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardSessionInvalidError, dashboardQueryOptions } from "@/modules/dashboard/app/dashboard-query";
import { DashboardScreen, type DashboardScreenState, type DashboardScreenStrings } from "./DashboardScreen";

export type DashboardContainerProps = {
  strings?: Partial<DashboardScreenStrings>;
};

export function DashboardContainer({ strings }: DashboardContainerProps = {}) {
  const router = useRouter();
  const clerk = useClerk();
  const { user, isLoaded } = useUser();
  // Logout failures are tracked separately from the dashboard query's own status —
  // a failed logout must keep showing its own error regardless of what the query is doing.
  const [status, setStatus] = useState<"idle" | "error-logout-failed">("idle");

  const enabled = isLoaded && Boolean(user);
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

  // A confirmed invalid session redirects away — never render dashboard data or the
  // generic error state while that navigation is in flight.
  const dashboardStatus: DashboardScreenState =
    !enabled || query.isPending || sessionInvalidError ? "loading" : query.isError ? "error" : "default";

  const renderStatus: DashboardScreenState = status === "error-logout-failed" ? status : dashboardStatus;
  const linked = query.data?.linked ?? false;

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

  return <DashboardScreen state={renderStatus} onLogout={handleLogout} linked={linked} strings={strings} />;
}
