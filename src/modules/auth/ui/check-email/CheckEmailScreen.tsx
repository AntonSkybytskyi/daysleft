import { Alert } from "@/modules/ui/Alert/Alert";
import { LinkButton } from "@/modules/ui/LinkButton/LinkButton";

export type CheckEmailScreenState =
  | "default"
  | "loading"
  | "resent-confirmation"
  | "error-rate-limited"
  | "error-sign-in-failed";

export type CheckEmailScreenStrings = {
  heading: string;
  body: string;
  resend: string;
  resendPrompt: string;
  resentConfirmation: string;
  errorRateLimited: string;
  errorSignInFailed: string;
};

const defaultStrings: CheckEmailScreenStrings = {
  heading: "Check your email",
  body: "We sent a sign-in link to {email}. Didn't get it?",
  resend: "Resend",
  // Used instead of `body` on error-sign-in-failed — that state means no link is confirmed
  // sent, so the "We sent a sign-in link..." claim would be false there.
  resendPrompt: "Didn't get it?",
  resentConfirmation: "Link resent to {email}.",
  errorRateLimited: "Too many requests. Wait a bit before trying again.",
  errorSignInFailed: "Couldn't resend the link. Try again in a moment.",
};

export type CheckEmailScreenProps = {
  state: CheckEmailScreenState;
  email: string;
  onResend: () => void;
  strings?: Partial<CheckEmailScreenStrings>;
};

export function CheckEmailScreen({ state, email, onResend, strings }: CheckEmailScreenProps) {
  const t = { ...defaultStrings, ...strings };
  const withEmail = (template: string) => template.replace("{email}", email);

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4 px-6 py-16">
      <h1 className="text-lg font-semibold text-slate-900">{t.heading}</h1>

      {state === "resent-confirmation" && <Alert variant="success">{withEmail(t.resentConfirmation)}</Alert>}
      {state === "error-rate-limited" && <Alert variant="error">{t.errorRateLimited}</Alert>}
      {state === "error-sign-in-failed" && <Alert variant="error">{t.errorSignInFailed}</Alert>}

      {(state === "default" || state === "loading") && (
        <p className="text-sm text-slate-600">
          {withEmail(t.body)}{" "}
          <LinkButton onClick={onResend} loading={state === "loading"}>
            {t.resend}
          </LinkButton>
        </p>
      )}

      {state === "error-sign-in-failed" && (
        <p className="text-sm text-slate-600">
          {t.resendPrompt}{" "}
          <LinkButton onClick={onResend}>{t.resend}</LinkButton>
        </p>
      )}
    </div>
  );
}
