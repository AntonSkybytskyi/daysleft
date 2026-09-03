import { headers } from "next/headers";
import { translate, translateAll } from "@/lib/i18n/translate";
import { LoginContainer } from "@/modules/auth/ui/login/LoginContainer";
import { resolveLoginReturnTo } from "@/modules/auth/app/return-to";
import { DASHBOARD_PATH } from "@/modules/dashboard/app/get-dashboard";
import { resolveLoginState, type LoginPageSearchParams } from "@/modules/auth/ui/login/resolve-login-state";
import type { LoginScreenStrings } from "@/modules/auth/ui/login/LoginScreen";

const stringKeys = [
  "login.continueWithGoogle",
  "login.continueWithGithub",
  "login.emailLabel",
  "login.emailPlaceholder",
  "login.sendMagicLink",
  "login.errorSignInFailed",
  "login.errorEmailRequired",
  "login.redirectedSignInRequired",
] as const;

function resolveStrings(acceptLanguage: string | null): Partial<LoginScreenStrings> {
  const t = translateAll(stringKeys, acceptLanguage);
  return {
    continueWithGoogle: t["login.continueWithGoogle"],
    continueWithGithub: t["login.continueWithGithub"],
    emailLabel: t["login.emailLabel"],
    emailPlaceholder: t["login.emailPlaceholder"],
    sendMagicLink: t["login.sendMagicLink"],
    errorSignInFailed: t["login.errorSignInFailed"],
    errorEmailRequired: t["login.errorEmailRequired"],
    redirectedSignInRequired: t["login.redirectedSignInRequired"],
  };
}

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
