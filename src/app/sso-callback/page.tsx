import { headers } from "next/headers";
import { SsoCallbackContainer } from "@/modules/auth/ui/sso-callback/SsoCallbackContainer";
import { resolveLoginReturnTo } from "@/modules/auth/app/return-to";
import { DASHBOARD_PATH } from "@/modules/dashboard/app/get-dashboard";
import { resolveStrings } from "./strings";

type SsoCallbackPageProps = {
  searchParams: { return_to?: string; flow?: string; email?: string };
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
  const acceptLanguage = requestHeaders.get("accept-language");

  return (
    <SsoCallbackContainer
      returnTo={returnTo}
      flow={flow}
      email={searchParams.email}
      strings={resolveStrings(acceptLanguage)}
    />
  );
}
