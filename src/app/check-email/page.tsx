import { CheckEmailContainer } from "@/modules/auth/ui/check-email/CheckEmailContainer";

type CheckEmailPageProps = {
  searchParams: { email?: string };
};

export default function CheckEmailPage({ searchParams }: CheckEmailPageProps) {
  return <CheckEmailContainer email={searchParams.email ?? ""} />;
}
