"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardScreen, type DashboardScreenStrings } from "./DashboardScreen";

export type DashboardContainerProps = {
  strings?: Partial<DashboardScreenStrings>;
};

export function DashboardContainer({ strings }: DashboardContainerProps = {}) {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [linked, setLinked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/v1/dashboard").then(async (response) => {
      if (cancelled) {
        return;
      }
      if (response.status === 401) {
        const body = await response.json();
        router.replace(body.code === "auth.email_required" ? "/login?error=email_required" : "/login");
        return;
      }
      const body = await response.json();
      setLinked(Boolean(body.linked));
      setLoaded(true);
    });

    return () => {
      cancelled = true;
    };
    // Fetch once on mount — re-running on every router identity change would
    // re-issue the request and re-consume the 401/200 response body.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    router.replace("/login");
  };

  return (
    <DashboardScreen
      state={loaded ? "default" : "loading"}
      onLogout={handleLogout}
      linked={linked}
      strings={strings}
    />
  );
}
