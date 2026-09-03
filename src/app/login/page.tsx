import { headers } from "next/headers";
import { translate } from "@/lib/i18n/translate";
import { LoginContainer } from "@/modules/auth/ui/login/LoginContainer";
import { resolveLoginReturnTo } from "@/modules/auth/app/return-to";
import { DASHBOARD_PATH } from "@/modules/dashboard/app/get-dashboard";
import { resolveLoginState, type LoginPageSearchParams } from "@/modules/auth/ui/login/resolve-login-state";
import { resolveStrings } from "./strings";

type LoginPageProps = {
  searchParams: LoginPageSearchParams;
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const requestHeaders = headers();
  const acceptLanguage = requestHeaders.get("accept-language");
  const heading = translate("login.heading", acceptLanguage);
  const returnTo = resolveLoginReturnTo(
    searchParams.return_to ?? null,
    requestHeaders.get("host"),
    requestHeaders.get("x-forwarded-proto"),
    DASHBOARD_PATH,
  );

  return (
    <LoginContainer
      heading={heading}
      returnTo={returnTo}
      initialState={resolveLoginState(searchParams)}
      strings={resolveStrings(acceptLanguage)}
    />
  );
}
