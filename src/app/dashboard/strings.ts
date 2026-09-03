import { translateAll } from "@/lib/i18n/translate";
import type { DashboardScreenStrings } from "@/modules/dashboard/ui/DashboardScreen";

export const stringKeys = [
  "dashboard.emptyState",
  "dashboard.emptyBody",
  "dashboard.linkedAccount",
  "dashboard.logout",
  "dashboard.errorFetchFailed",
] as const;

export function resolveStrings(acceptLanguage: string | null): Partial<DashboardScreenStrings> {
  const t = translateAll(stringKeys, acceptLanguage);
  return {
    emptyHeading: t["dashboard.emptyState"],
    emptyBody: t["dashboard.emptyBody"],
    linkedAccount: t["dashboard.linkedAccount"],
    logout: t["dashboard.logout"],
    errorFetchFailed: t["dashboard.errorFetchFailed"],
  };
}
