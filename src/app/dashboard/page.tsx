import { headers } from "next/headers";
import { DashboardContainer } from "@/modules/dashboard/ui/DashboardContainer";
import { DestinationsView } from "@/modules/destinations/ui/DestinationsView";
import { resolveStrings } from "./strings";

export default function DashboardPage({
  searchParams,
}: {
  searchParams: { unavailable?: string };
}) {
  const acceptLanguage = headers().get("accept-language");
  return (
    <DashboardContainer strings={resolveStrings(acceptLanguage)}>
      <DestinationsView addressUnavailable={searchParams.unavailable === "1"} />
    </DashboardContainer>
  );
}
