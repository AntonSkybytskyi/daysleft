import { headers } from "next/headers";
import { translate, translateAll } from "@/lib/i18n/translate";
import { LoginContainer } from "@/modules/auth/ui/login/LoginContainer";
import { resolveLoginReturnTo } from "@/modules/dashboard/app/return-to";
import type { LoginScreenState, LoginScreenStrings } from "@/modules/auth/ui/login/LoginScreen";

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
    <LoginContainer
      heading={heading}
      returnTo={returnTo}
      initialState={resolveState(searchParams)}
      strings={resolveStrings(acceptLanguage)}
    />
  );
}
