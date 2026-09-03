import { Alert } from "@/modules/ui/Alert/Alert";
import { Button } from "@/modules/ui/Button/Button";

export type MagicLinkInvalidScreenState =
  | "default"
  | "loading"
  | "error-rate-limited"
  | "error-sign-in-failed"
  | "verified-elsewhere";

export type MagicLinkInvalidScreenStrings = {
  heading: string;
  body: string;
  sendNewLink: string;
  errorRateLimited: string;
  errorSignInFailed: string;
  verifiedElsewhereHeading: string;
  verifiedElsewhereBody: string;
};

const defaultStrings: MagicLinkInvalidScreenStrings = {
  heading: "This link is no longer valid",
  body: "It may have expired, already been used, or been replaced by a newer one.",
  sendNewLink: "Send a new link",
  errorRateLimited: "Too many requests. Wait a bit before trying again.",
  errorSignInFailed: "Couldn't send a new link. Try again in a moment.",
  verifiedElsewhereHeading: "You're signed in",
  verifiedElsewhereBody: "This link was opened on another device. You're signed in on your other device — you can close this tab.",
};

export type MagicLinkInvalidScreenProps = {
  state: MagicLinkInvalidScreenState;
  onSendNewLink: () => void;
  strings?: Partial<MagicLinkInvalidScreenStrings>;
};

export function MagicLinkInvalidScreen({ state, onSendNewLink, strings }: MagicLinkInvalidScreenProps) {
  const t = { ...defaultStrings, ...strings };

  if (state === "verified-elsewhere") {
    return (
      <div className="mx-auto flex max-w-sm flex-col gap-4 px-6 py-16">
        <h1 className="text-lg font-semibold text-slate-900">{t.verifiedElsewhereHeading}</h1>
        <Alert variant="success">{t.verifiedElsewhereBody}</Alert>
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
