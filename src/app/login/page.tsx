import { headers } from "next/headers";
import { translate } from "@/lib/i18n/translate";
import { LoginContainer } from "@/modules/auth/ui/login/LoginContainer";
import { DASHBOARD_PATH } from "@/modules/dashboard/app/get-dashboard";
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
  const acceptLanguage = headers().get("accept-language");
  const heading = translate("login.heading", acceptLanguage);

  return (
    <LoginContainer
      heading={heading}
      returnTo={searchParams.return_to ?? DASHBOARD_PATH}
      initialState={resolveState(searchParams)}
    />
  );
}
