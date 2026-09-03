import { headers } from "next/headers";
import { SsoCallbackContainer } from "@/modules/auth/ui/sso-callback/SsoCallbackContainer";
import { resolveLoginReturnTo } from "@/modules/dashboard/app/return-to";

type SsoCallbackPageProps = {
  searchParams: { return_to?: string };
};

export default function SsoCallbackPage({ searchParams }: SsoCallbackPageProps) {
  const requestHeaders = headers();
  const returnTo = resolveLoginReturnTo(
    searchParams.return_to ?? null,
    requestHeaders.get("host"),
    requestHeaders.get("x-forwarded-proto"),
  );

  return <SsoCallbackContainer returnTo={returnTo} />;
}
