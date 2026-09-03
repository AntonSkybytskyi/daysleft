"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardScreen } from "./DashboardScreen";

export function DashboardContainer() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);

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
      setLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    router.replace("/login");
  };

  return <DashboardScreen state={loaded ? "default" : "loading"} onLogout={handleLogout} />;
}
