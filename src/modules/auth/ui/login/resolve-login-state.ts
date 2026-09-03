import type { LoginScreenState } from "./LoginScreen";

export type LoginPageSearchParams = { return_to?: string; error?: string };

export function resolveLoginState(searchParams: LoginPageSearchParams): LoginScreenState {
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
