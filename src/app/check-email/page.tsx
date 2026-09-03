import { headers } from "next/headers";
import { CheckEmailContainer } from "@/modules/auth/ui/check-email/CheckEmailContainer";
import { resolveStrings } from "./strings";

type CheckEmailPageProps = {
  searchParams: { email?: string };
};

export default function CheckEmailPage({ searchParams }: CheckEmailPageProps) {
  const acceptLanguage = headers().get("accept-language");
  return (
    <CheckEmailContainer email={searchParams.email ?? ""} strings={resolveStrings(acceptLanguage)} />
  );
}
