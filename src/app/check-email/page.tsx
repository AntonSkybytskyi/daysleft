import { headers } from "next/headers";
import { translateAll } from "@/lib/i18n/translate";
import { CheckEmailContainer } from "@/modules/auth/ui/check-email/CheckEmailContainer";
import type { CheckEmailScreenStrings } from "@/modules/auth/ui/check-email/CheckEmailScreen";

type CheckEmailPageProps = {
  searchParams: { email?: string };
};

const stringKeys = [
  "checkEmail.heading",
  "checkEmail.body",
  "checkEmail.resend",
  "checkEmail.resentConfirmation",
  "checkEmail.errorRateLimited",
] as const;

function resolveStrings(acceptLanguage: string | null): Partial<CheckEmailScreenStrings> {
  const t = translateAll(stringKeys, acceptLanguage);
  return {
    heading: t["checkEmail.heading"],
    body: t["checkEmail.body"],
    resend: t["checkEmail.resend"],
    resentConfirmation: t["checkEmail.resentConfirmation"],
    errorRateLimited: t["checkEmail.errorRateLimited"],
  };
}

export default function CheckEmailPage({ searchParams }: CheckEmailPageProps) {
  const acceptLanguage = headers().get("accept-language");
  return (
    <CheckEmailContainer email={searchParams.email ?? ""} strings={resolveStrings(acceptLanguage)} />
  );
}
