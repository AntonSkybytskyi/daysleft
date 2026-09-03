import { headers } from "next/headers";
import { SsoCallbackContainer } from "@/modules/auth/ui/sso-callback/SsoCallbackContainer";
import { resolveLoginReturnTo } from "@/modules/auth/app/return-to";
import { DASHBOARD_PATH } from "@/modules/dashboard/app/get-dashboard";

type SsoCallbackPageProps = {
  searchParams: { return_to?: string; flow?: string };
};

export default function SsoCallbackPage({ searchParams }: SsoCallbackPageProps) {
  const requestHeaders = headers();
  const returnTo = resolveLoginReturnTo(
    searchParams.return_to ?? null,
    requestHeaders.get("host"),
    requestHeaders.get("x-forwarded-proto"),
    DASHBOARD_PATH,
  );
  const flow = searchParams.flow === "email_link" ? "email_link" : "oauth";

  return <SsoCallbackContainer returnTo={returnTo} flow={flow} />;
}
