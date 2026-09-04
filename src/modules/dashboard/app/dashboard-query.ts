import type { QueryClient } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import type { ErrorBody } from "@/lib/errors";

export type DashboardData = {
  user: { id: string; email: string };
  has_trips: false;
  linked: boolean;
};

export class DashboardSessionInvalidError extends Error {
  readonly loginUrl: string;

  constructor(loginUrl: string) {
    super("Dashboard session invalid");
    this.name = "DashboardSessionInvalidError";
    this.loginUrl = loginUrl;
  }
}

function resolveLoginUrl(error: ErrorBody | undefined, path: string): string {
  if (error?.code === "auth.email_required") {
    return "/login?error=email_required";
  }
  if (error?.code === "auth.email_conflict") {
    return "/login?error=email_conflict";
  }
  const returnTo = (error?.details?.return_to as string | undefined) ?? path;
  return `/login?return_to=${encodeURIComponent(returnTo)}`;
}

async function fetchDashboard(): Promise<DashboardData> {
  const path = `${window.location.pathname}${window.location.search}`;
  const response = await fetch(`/api/v1/dashboard?path=${encodeURIComponent(path)}`);

  if (response.status === 401) {
    const { error } = (await response.json()) as { error?: ErrorBody };
    throw new DashboardSessionInvalidError(resolveLoginUrl(error, path));
  }

  if (!response.ok) {
    throw new Error(`Dashboard fetch failed with status ${response.status}`);
  }

  return (await response.json()) as DashboardData;
}

export function dashboardQueryKey(userId: string) {
  return ["dashboard", userId] as const;
}

export function dashboardQueryOptions(userId: string) {
  return queryOptions({
    queryKey: dashboardQueryKey(userId),
    queryFn: fetchDashboard,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });
}

export function clearDashboardQuery(queryClient: QueryClient, userId: string) {
  queryClient.removeQueries({ queryKey: dashboardQueryKey(userId) });
}
