import { translateAll } from "@/lib/i18n/translate";
import type { LoginScreenStrings } from "@/modules/auth/ui/login/LoginScreen";

export const stringKeys = [
  "login.heading",
  "login.continueWithGoogle",
  "login.continueWithGithub",
  "login.emailLabel",
  "login.emailPlaceholder",
  "login.sendMagicLink",
  "login.errorSignInFailed",
  "login.errorEmailRequired",
  "login.errorEmailConflict",
  "login.redirectedSignInRequired",
] as const;

export function resolveStrings(acceptLanguage: string | null): Partial<LoginScreenStrings> {
  const t = translateAll(stringKeys, acceptLanguage);
  return {
    continueWithGoogle: t["login.continueWithGoogle"],
    continueWithGithub: t["login.continueWithGithub"],
    emailLabel: t["login.emailLabel"],
    emailPlaceholder: t["login.emailPlaceholder"],
    sendMagicLink: t["login.sendMagicLink"],
    errorSignInFailed: t["login.errorSignInFailed"],
    errorEmailRequired: t["login.errorEmailRequired"],
    errorEmailConflict: t["login.errorEmailConflict"],
    redirectedSignInRequired: t["login.redirectedSignInRequired"],
  };
}
