import { translateAll } from "@/lib/i18n/translate";
import type { MagicLinkInvalidScreenStrings } from "@/modules/auth/ui/magic-link-invalid/MagicLinkInvalidScreen";

export const stringKeys = [
  "magicLinkInvalid.heading",
  "magicLinkInvalid.body",
  "magicLinkInvalid.sendNewLink",
  "magicLinkInvalid.errorRateLimited",
] as const;

export function resolveStrings(acceptLanguage: string | null): Partial<MagicLinkInvalidScreenStrings> {
  const t = translateAll(stringKeys, acceptLanguage);
  return {
    heading: t["magicLinkInvalid.heading"],
    body: t["magicLinkInvalid.body"],
    sendNewLink: t["magicLinkInvalid.sendNewLink"],
    errorRateLimited: t["magicLinkInvalid.errorRateLimited"],
  };
}
