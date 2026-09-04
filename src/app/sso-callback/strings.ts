import { translateAll } from "@/lib/i18n/translate";
import type { MagicLinkInvalidScreenStrings } from "@/modules/auth/ui/magic-link-invalid/MagicLinkInvalidScreen";

export const stringKeys = [
  "magicLinkInvalid.heading",
  "magicLinkInvalid.body",
  "magicLinkInvalid.sendNewLink",
  "magicLinkInvalid.errorRateLimited",
  "magicLinkInvalid.errorSignInFailed",
  "magicLinkInvalid.verifiedElsewhereHeading",
  "magicLinkInvalid.verifiedElsewhereBody",
  "magicLinkInvalid.unconfirmedElsewhereHeading",
  "magicLinkInvalid.unconfirmedElsewhereBody",
  "magicLinkInvalid.backToLogin",
] as const;

export function resolveStrings(acceptLanguage: string | null): Partial<MagicLinkInvalidScreenStrings> {
  const t = translateAll(stringKeys, acceptLanguage);
  return {
    heading: t["magicLinkInvalid.heading"],
    body: t["magicLinkInvalid.body"],
    sendNewLink: t["magicLinkInvalid.sendNewLink"],
    errorRateLimited: t["magicLinkInvalid.errorRateLimited"],
    errorSignInFailed: t["magicLinkInvalid.errorSignInFailed"],
    verifiedElsewhereHeading: t["magicLinkInvalid.verifiedElsewhereHeading"],
    verifiedElsewhereBody: t["magicLinkInvalid.verifiedElsewhereBody"],
    unconfirmedElsewhereHeading: t["magicLinkInvalid.unconfirmedElsewhereHeading"],
    unconfirmedElsewhereBody: t["magicLinkInvalid.unconfirmedElsewhereBody"],
    backToLogin: t["magicLinkInvalid.backToLogin"],
  };
}
