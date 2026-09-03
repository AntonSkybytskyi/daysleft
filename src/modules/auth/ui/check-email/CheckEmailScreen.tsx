import { Alert } from "@/modules/ui/Alert/Alert";
import { LinkButton } from "@/modules/ui/LinkButton/LinkButton";

export type CheckEmailScreenState = "default" | "loading" | "resent-confirmation" | "error-rate-limited";

export type CheckEmailScreenProps = {
  state: CheckEmailScreenState;
  email: string;
  onResend: () => void;
};

export function CheckEmailScreen({ state, email, onResend }: CheckEmailScreenProps) {
  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4 px-6 py-16">
      <h1 className="text-lg font-semibold text-slate-900">Check your email</h1>

      {state === "resent-confirmation" && <Alert variant="success">Link resent to {email}.</Alert>}
      {state === "error-rate-limited" && <Alert variant="error">Too many requests. Wait a bit before trying again.</Alert>}

      {(state === "default" || state === "loading") && (
        <p className="text-sm text-slate-600">
          We sent a sign-in link to {email}. Didn&apos;t get it?{" "}
          <LinkButton onClick={onResend} loading={state === "loading"}>
            Resend
          </LinkButton>
        </p>
      )}
    </div>
  );
}
