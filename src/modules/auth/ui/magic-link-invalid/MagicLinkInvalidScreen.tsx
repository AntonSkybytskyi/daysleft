import { Alert } from "@/modules/ui/Alert/Alert";
import { Button } from "@/modules/ui/Button/Button";

export type MagicLinkInvalidScreenState =
  | "default"
  | "loading"
  | "error-rate-limited"
  | "error-sign-in-failed"
  | "verified-elsewhere"
  | "verified-elsewhere-unconfirmed";

export type MagicLinkInvalidScreenStrings = {
  heading: string;
  body: string;
  sendNewLink: string;
  errorRateLimited: string;
  errorSignInFailed: string;
  verifiedElsewhereHeading: string;
  verifiedElsewhereBody: string;
  unconfirmedElsewhereHeading: string;
  unconfirmedElsewhereBody: string;
  backToLogin: string;
};

const defaultStrings: MagicLinkInvalidScreenStrings = {
  heading: "This link is no longer valid",
  body: "It may have expired, already been used, or been replaced by a newer one.",
  sendNewLink: "Send a new link",
  errorRateLimited: "Too many requests. Wait a bit before trying again.",
  errorSignInFailed: "Couldn't send a new link. Try again in a moment.",
  verifiedElsewhereHeading: "You're signed in",
  verifiedElsewhereBody: "This link was opened on another device. You're signed in on your other device — you can close this tab.",
  unconfirmedElsewhereHeading: "This link was already opened elsewhere",
  unconfirmedElsewhereBody:
    "This device can't confirm whether that completed. If it didn't, go back and request a new link.",
  backToLogin: "Back to login",
};

export type MagicLinkInvalidScreenProps = {
  state: MagicLinkInvalidScreenState;
  // Only rendered by "default"/"loading"/"error-*" — neither "verified-elsewhere" state has a
  // resend CTA (nothing to supersede in one case, nothing safe to offer in the other), so the
  // handle stays unreachable rather than merely unrendered.
  onSendNewLink?: () => void;
  onBackToLogin?: () => void;
  strings?: Partial<MagicLinkInvalidScreenStrings>;
};

export function MagicLinkInvalidScreen({ state, onSendNewLink, onBackToLogin, strings }: MagicLinkInvalidScreenProps) {
  const t = { ...defaultStrings, ...strings };

  if (state === "verified-elsewhere") {
    return (
      <div className="mx-auto flex max-w-sm flex-col gap-4 px-6 py-16">
        <h1 className="text-lg font-semibold text-slate-900">{t.verifiedElsewhereHeading}</h1>
        <Alert variant="success">{t.verifiedElsewhereBody}</Alert>
      </div>
    );
  }

  if (state === "verified-elsewhere-unconfirmed") {
    // Unlike "verified-elsewhere" (a sign-in whose completion the originating device polls
    // for), this link belonged to a first-time sign-up attempt, which has no poll — so there
    // is no session to protect from a superseding resend, but also none to honestly confirm.
    // The only safe move is a non-destructive path back, not a fabricated success claim and
    // not the resend that would supersede a sign-in poll this flow doesn't have.
    return (
      <div className="mx-auto flex max-w-sm flex-col gap-4 px-6 py-16">
        <h1 className="text-lg font-semibold text-slate-900">{t.unconfirmedElsewhereHeading}</h1>
        <Alert variant="error">{t.unconfirmedElsewhereBody}</Alert>
        <Button variant="primary" onClick={onBackToLogin}>
          {t.backToLogin}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4 px-6 py-16">
      <h1 className="text-lg font-semibold text-slate-900">{t.heading}</h1>

      {state === "error-rate-limited" ? (
        <Alert variant="error">{t.errorRateLimited}</Alert>
      ) : state === "error-sign-in-failed" ? (
        <>
          <Alert variant="error">{t.errorSignInFailed}</Alert>
          <Button variant="primary" onClick={onSendNewLink}>
            {t.sendNewLink}
          </Button>
        </>
      ) : (
        <>
          <Alert variant="error">{t.body}</Alert>
          <Button variant="primary" onClick={onSendNewLink} loading={state === "loading"}>
            {t.sendNewLink}
          </Button>
        </>
      )}
    </div>
  );
}
