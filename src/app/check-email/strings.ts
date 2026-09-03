import { translateAll } from "@/lib/i18n/translate";
import type { CheckEmailScreenStrings } from "@/modules/auth/ui/check-email/CheckEmailScreen";

export const stringKeys = [
  "checkEmail.heading",
  "checkEmail.body",
  "checkEmail.resend",
  "checkEmail.resentConfirmation",
  "checkEmail.errorRateLimited",
] as const;

export function resolveStrings(acceptLanguage: string | null): Partial<CheckEmailScreenStrings> {
  const t = translateAll(stringKeys, acceptLanguage);
  return {
    heading: t["checkEmail.heading"],
    body: t["checkEmail.body"],
    resend: t["checkEmail.resend"],
    resentConfirmation: t["checkEmail.resentConfirmation"],
    errorRateLimited: t["checkEmail.errorRateLimited"],
  };
}
