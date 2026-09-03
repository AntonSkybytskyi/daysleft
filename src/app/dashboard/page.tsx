import { headers } from "next/headers";
import { translateAll } from "@/lib/i18n/translate";
import { DashboardContainer } from "@/modules/dashboard/ui/DashboardContainer";
import type { DashboardScreenStrings } from "@/modules/dashboard/ui/DashboardScreen";

const stringKeys = [
  "dashboard.emptyState",
  "dashboard.emptyBody",
  "dashboard.linkedAccount",
  "dashboard.logout",
] as const;

function resolveStrings(acceptLanguage: string | null): Partial<DashboardScreenStrings> {
  const t = translateAll(stringKeys, acceptLanguage);
  return {
    emptyHeading: t["dashboard.emptyState"],
    emptyBody: t["dashboard.emptyBody"],
    linkedAccount: t["dashboard.linkedAccount"],
    logout: t["dashboard.logout"],
  };
}

export default function DashboardPage() {
  const acceptLanguage = headers().get("accept-language");
  return <DashboardContainer strings={resolveStrings(acceptLanguage)} />;
}
