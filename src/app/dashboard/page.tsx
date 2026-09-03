import { headers } from "next/headers";
import { DashboardContainer } from "@/modules/dashboard/ui/DashboardContainer";
import { resolveStrings } from "./strings";

export default function DashboardPage() {
  const acceptLanguage = headers().get("accept-language");
  return <DashboardContainer strings={resolveStrings(acceptLanguage)} />;
}
