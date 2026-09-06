import { headers } from "next/headers";
import { DashboardContainer } from "@/modules/dashboard/ui/DashboardContainer";
import { DestinationsView } from "@/modules/destinations/ui/DestinationsView";
import { resolveStrings } from "../strings";

export default function DestinationDetailPage({
  params,
}: {
  params: { trackedDestinationId: string };
}) {
  const acceptLanguage = headers().get("accept-language");
  return (
    <DashboardContainer strings={resolveStrings(acceptLanguage)}>
      <DestinationsView trackedDestinationId={params.trackedDestinationId} />
    </DashboardContainer>
  );
}
