"use client";

import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardScreen, type DashboardScreenStrings } from "./DashboardScreen";

export type DashboardContainerProps = {
  strings?: Partial<DashboardScreenStrings>;
};

export function DashboardContainer({ strings }: DashboardContainerProps = {}) {
  const router = useRouter();
  const clerk = useClerk();
  const [status, setStatus] = useState<"loading" | "default" | "error" | "error-logout-failed">("loading");
  const [linked, setLinked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const path = `${window.location.pathname}${window.location.search}`;

    fetch(`/api/v1/dashboard?path=${encodeURIComponent(path)}`)
      .then(async (response) => {
        if (cancelled) {
          return;
        }
        if (response.status === 401) {
          const { error } = await response.json();
          const loginUrl =
            error?.code === "auth.email_required"
              ? "/login?error=email_required"
              : error?.code === "auth.email_conflict"
                ? "/login?error=email_conflict"
                : `/login?return_to=${encodeURIComponent(error?.details?.return_to ?? path)}`;
          router.replace(loginUrl);
          return;
        }
        const body = await response.json();
        setLinked(Boolean(body.linked));
        setStatus("default");
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
    // Fetch once on mount — re-running on every router identity change would
    // re-issue the request and re-consume the 401/200 response body.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    try {
      await clerk.signOut();
    } catch {
      // The server already revoked the session — that's authoritative. Retrying would
      // only re-POST a logout that now 401s, trapping the user behind an error that can
      // never resolve while they still hold a stale client JWT.
    }
    router.replace("/login");
  };

  return <DashboardScreen state={status} onLogout={handleLogout} linked={linked} strings={strings} />;
}
