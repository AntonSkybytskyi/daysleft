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

export type LoginScreenProps = {
  state: LoginScreenState;
  email: string;
  onEmailChange: (value: string) => void;
  onGoogleClick: () => void;
  onGithubClick: () => void;
  onSendMagicLink: () => void;
  loadingProvider?: "google" | "github" | "email";
  heading?: string;
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
}: LoginScreenProps) {
  const showEmailField = state !== "error-email-required";

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4 px-6 py-16">
      <h1 className="text-lg font-semibold text-slate-900">{heading}</h1>

      {state === "error-sign-in-failed" && (
        <Alert variant="error">Sign-in didn&apos;t complete. Try again with any method below.</Alert>
      )}
      {state === "error-email-required" && (
        <Alert variant="error">
          Your provider didn&apos;t share a verified email. Make one visible or verified, then try again.
        </Alert>
      )}
      {state === "redirected-sign-in-required" && <Alert variant="info">Sign in to continue.</Alert>}

      <OAuthProviderButton
        provider="google"
        onClick={onGoogleClick}
        loading={state === "loading" && loadingProvider === "google"}
      />
      <OAuthProviderButton
        provider="github"
        onClick={onGithubClick}
        loading={state === "loading" && loadingProvider === "github"}
      />

      {showEmailField && (
        <>
          <EmailInput label="Email" value={email} onChange={onEmailChange} placeholder="you@example.com" />
          <Button
            variant="primary"
            onClick={onSendMagicLink}
            loading={state === "loading" && loadingProvider === "email"}
          >
            Send magic link
          </Button>
        </>
      )}
    </div>
  );
}
