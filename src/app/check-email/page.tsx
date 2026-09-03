import { headers } from "next/headers";
import { CheckEmailContainer } from "@/modules/auth/ui/check-email/CheckEmailContainer";
import { resolveLoginReturnTo } from "@/modules/auth/app/return-to";
import { DASHBOARD_PATH } from "@/modules/dashboard/app/get-dashboard";
import { resolveStrings } from "./strings";

type CheckEmailPageProps = {
  searchParams: { email?: string; return_to?: string };
};

export default function CheckEmailPage({ searchParams }: CheckEmailPageProps) {
  const requestHeaders = headers();
  const acceptLanguage = requestHeaders.get("accept-language");
  const returnTo = resolveLoginReturnTo(
    searchParams.return_to ?? null,
    requestHeaders.get("host"),
    requestHeaders.get("x-forwarded-proto"),
    DASHBOARD_PATH,
  );

  return (
    <CheckEmailContainer
      email={searchParams.email ?? ""}
      returnTo={returnTo}
      strings={resolveStrings(acceptLanguage)}
    />
  );
}
