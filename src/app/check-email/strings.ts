import { translateAll } from "@/lib/i18n/translate";
import type { CheckEmailScreenStrings } from "@/modules/auth/ui/check-email/CheckEmailScreen";

export const stringKeys = [
  "checkEmail.heading",
  "checkEmail.body",
  "checkEmail.resend",
  "checkEmail.resendPrompt",
  "checkEmail.resentConfirmation",
  "checkEmail.errorRateLimited",
  "checkEmail.errorSignInFailed",
] as const;

export function resolveStrings(acceptLanguage: string | null): Partial<CheckEmailScreenStrings> {
  const t = translateAll(stringKeys, acceptLanguage);
  return {
    heading: t["checkEmail.heading"],
    body: t["checkEmail.body"],
    resend: t["checkEmail.resend"],
    resendPrompt: t["checkEmail.resendPrompt"],
    resentConfirmation: t["checkEmail.resentConfirmation"],
    errorRateLimited: t["checkEmail.errorRateLimited"],
    errorSignInFailed: t["checkEmail.errorSignInFailed"],
  };
}
