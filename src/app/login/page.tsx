import { headers } from "next/headers";
import { translate } from "@/lib/i18n/translate";
import { LoginContainer } from "@/modules/auth/ui/login/LoginContainer";
import { resolveLoginReturnTo } from "@/modules/dashboard/app/return-to";
import type { LoginScreenState } from "@/modules/auth/ui/login/LoginScreen";

type LoginPageProps = {
  searchParams: { return_to?: string; error?: string };
};

function resolveState(searchParams: LoginPageProps["searchParams"]): LoginScreenState {
  if (searchParams.error === "sign_in_failed") {
    return "error-sign-in-failed";
  }
  if (searchParams.error === "email_required") {
    return "error-email-required";
  }
  if (searchParams.return_to) {
    return "redirected-sign-in-required";
  }
  return "default";
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const requestHeaders = headers();
  const acceptLanguage = requestHeaders.get("accept-language");
  const heading = translate("login.heading", acceptLanguage);
  const returnTo = resolveLoginReturnTo(
    searchParams.return_to ?? null,
    requestHeaders.get("host"),
    requestHeaders.get("x-forwarded-proto"),
  );

  return (
    <LoginContainer heading={heading} returnTo={returnTo} initialState={resolveState(searchParams)} />
  );
}
