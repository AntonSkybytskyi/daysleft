import { Alert } from "@/modules/ui/Alert/Alert";
import { Button } from "@/modules/ui/Button/Button";
import { EmailInput } from "@/modules/ui/EmailInput/EmailInput";
import { OAuthProviderButton } from "@/modules/ui/OAuthProviderButton/OAuthProviderButton";

export type LoginScreenState =
  | "default"
  | "loading"
  | "error-sign-in-failed"
  | "error-email-required"
  | "redirected-sign-in-required";

export type LoginScreenStrings = {
  continueWithGoogle: string;
  continueWithGithub: string;
  emailLabel: string;
  emailPlaceholder: string;
  sendMagicLink: string;
  errorSignInFailed: string;
  errorEmailRequired: string;
  redirectedSignInRequired: string;
};

const defaultStrings: LoginScreenStrings = {
  continueWithGoogle: "Continue with Google",
  continueWithGithub: "Continue with GitHub",
  emailLabel: "Email",
  emailPlaceholder: "you@example.com",
  sendMagicLink: "Send magic link",
  errorSignInFailed: "Sign-in didn't complete. Try again with any method below.",
  errorEmailRequired: "Your provider didn't share a verified email. Make one visible or verified, then try again.",
  redirectedSignInRequired: "Sign in to continue.",
};

export type LoginScreenProps = {
  state: LoginScreenState;
  email: string;
  onEmailChange: (value: string) => void;
  onGoogleClick: () => void;
  onGithubClick: () => void;
  onSendMagicLink: () => void;
  loadingProvider?: "google" | "github" | "email";
  heading?: string;
  strings?: Partial<LoginScreenStrings>;
};

export function LoginScreen({
  state,
  email,
  onEmailChange,
  onGoogleClick,
  onGithubClick,
  onSendMagicLink,
  loadingProvider,
  heading = "Sign in to daysleft",
  strings,
}: LoginScreenProps) {
  const t = { ...defaultStrings, ...strings };
  const showEmailField = state !== "error-email-required";

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4 px-6 py-16">
      <h1 className="text-lg font-semibold text-slate-900">{heading}</h1>

      {state === "error-sign-in-failed" && <Alert variant="error">{t.errorSignInFailed}</Alert>}
      {state === "error-email-required" && <Alert variant="error">{t.errorEmailRequired}</Alert>}
      {state === "redirected-sign-in-required" && <Alert variant="info">{t.redirectedSignInRequired}</Alert>}

      <OAuthProviderButton provider="google" label={t.continueWithGoogle} onClick={onGoogleClick} loading={state === "loading" && loadingProvider === "google"} />
      <OAuthProviderButton provider="github" label={t.continueWithGithub} onClick={onGithubClick} loading={state === "loading" && loadingProvider === "github"} />

      {showEmailField && (
        <>
          <EmailInput label={t.emailLabel} value={email} onChange={onEmailChange} placeholder={t.emailPlaceholder} />
          <Button variant="primary" onClick={onSendMagicLink} loading={state === "loading" && loadingProvider === "email"}>
            {t.sendMagicLink}
          </Button>
        </>
      )}
    </div>
  );
}
