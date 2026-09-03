"use client";

import { useClerk } from "@clerk/nextjs";
import { useSignIn, useSignUp } from "@clerk/nextjs/legacy";
import { EmailLinkErrorCodeStatus, isClerkAPIResponseError, isEmailLinkError } from "@clerk/nextjs/errors";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Spinner } from "@/modules/ui/Spinner/Spinner";
import {
  MagicLinkInvalidScreen,
  type MagicLinkInvalidScreenStrings,
} from "@/modules/auth/ui/magic-link-invalid/MagicLinkInvalidScreen";

export type SsoCallbackDeps = {
  handleRedirectCallback: (opts: {
    signInFallbackRedirectUrl: string;
    signUpFallbackRedirectUrl: string;
  }) => Promise<unknown>;
  handleEmailLinkVerification: (opts: {
    redirectUrlComplete: string;
    onVerifiedOnOtherDevice?: () => void;
  }) => Promise<unknown>;
  sendMagicLink: (opts: { identifier: string; redirectUrl: string }) => Promise<unknown>;
  signUp: {
    create: (opts: { emailAddress: string }) => Promise<unknown>;
    prepareEmailAddressVerification: (opts: { strategy: "email_link"; redirectUrl: string }) => Promise<unknown>;
  };
};

export type SsoCallbackContainerProps = {
  returnTo: string;
  flow?: "email_link" | "oauth";
  email?: string;
  // True when the link being opened here belongs to a first-time sign-up attempt (the
  // "?signup=1" marker CheckEmailContainer/LoginContainer/this container's own resend add to
  // the redirectUrl for that branch). A sign-up attempt has no originating-device poll, so a
  // client_mismatch/onVerifiedOnOtherDevice here can't be reported as a real success — see
  // isSignUp's use below.
  isSignUp?: boolean;
  deps?: SsoCallbackDeps;
  strings?: Partial<MagicLinkInvalidScreenStrings>;
};

function isInvalidEmailLink(error: unknown): boolean {
  if (!isEmailLinkError(error as Error)) {
    return false;
  }
  const code = (error as { code?: string }).code;
  return code === EmailLinkErrorCodeStatus.Expired || code === EmailLinkErrorCodeStatus.Failed;
}

// ClientMismatch means the link WAS verified, just not by this browser — the originating
// device (polling via startEmailLinkFlow on /check-email) is the one that completes the
// sign-in. This is a success being reported here, not a failure.
function isVerifiedElsewhereEmailLink(error: unknown): boolean {
  if (!isEmailLinkError(error as Error)) {
    return false;
  }
  return (error as { code?: string }).code === EmailLinkErrorCodeStatus.ClientMismatch;
}

function isRateLimited(error: unknown): boolean {
  return isClerkAPIResponseError(error as Error) && (error as { status?: number }).status === 429;
}

function isFormIdentifierNotFound(error: unknown): boolean {
  const errors = (error as { errors?: { code?: string }[] } | undefined)?.errors;
  return Boolean(errors?.some((entry) => entry.code === "form_identifier_not_found"));
}

export function SsoCallbackContainer({
  returnTo,
  flow = "oauth",
  email,
  isSignUp = false,
  deps,
  strings,
}: SsoCallbackContainerProps) {
  const router = useRouter();
  const clerk = useClerk();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const [screenState, setScreenState] = useState<
    "pending" | "invalid" | "verified-elsewhere" | "verified-elsewhere-unconfirmed"
  >("pending");
  const [resendState, setResendState] = useState<"idle" | "loading" | "error-rate-limited" | "error-sign-in-failed">(
    "idle",
  );

  useEffect(() => {
    if (flow === "email_link") {
      const handleEmailLinkVerification =
        deps?.handleEmailLinkVerification ?? ((opts) => clerk.handleEmailLinkVerification(opts));

      handleEmailLinkVerification({
        redirectUrlComplete: returnTo,
        // Fires when Clerk verified this link on a DIFFERENT browser/device than the one running
        // this callback — the sign-in completes over there (the originating device polls for it
        // via startEmailLinkFlow), not here, so this device must not navigate to returnTo, but it
        // also must not claim the link was invalid: it worked, just not on this browser.
        onVerifiedOnOtherDevice: () => setScreenState(isSignUp ? "verified-elsewhere-unconfirmed" : "verified-elsewhere"),
      }).catch((error) => {
        if (isVerifiedElsewhereEmailLink(error)) {
          setScreenState(isSignUp ? "verified-elsewhere-unconfirmed" : "verified-elsewhere");
          return;
        }
        if (isInvalidEmailLink(error)) {
          setScreenState("invalid");
          return;
        }
        router.replace("/login?error=sign_in_failed");
      });
      return;
    }

    const handleRedirectCallback = deps?.handleRedirectCallback ?? ((opts) => clerk.handleRedirectCallback(opts));

    handleRedirectCallback({ signInFallbackRedirectUrl: returnTo, signUpFallbackRedirectUrl: returnTo }).catch(() => {
      router.replace("/login?error=sign_in_failed");
    });
    // Runs once for this callback visit — returnTo/flow/deps/router/clerk are stable for the page's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendNewLink = async () => {
    if (!email || (!deps?.sendMagicLink && !signIn)) {
      router.replace("/login");
      return;
    }
    setResendState("loading");
    // Resolves the identifier only — the actual send happens on /check-email via
    // createEmailLinkFlow, which also polls for cross-device completion (AC-02b).
    const sendMagicLink = deps?.sendMagicLink ?? ((opts) => signIn!.create({ identifier: opts.identifier }));
    const redirectUrl = `${window.location.origin}/sso-callback?return_to=${encodeURIComponent(returnTo)}&flow=email_link&email=${encodeURIComponent(email)}`;
    // The sign-up branch has no originating-device poll, so a client_mismatch on this link
    // can't be reported as a real success (see isSignUp above) — marked on its own redirectUrl,
    // not the sign-in one above, since sendMagicLink's real signIn.create() doesn't take it.
    const signUpRedirectUrl = `${redirectUrl}&signup=1`;

    const goToCheckEmail = () =>
      router.replace(`/check-email?email=${encodeURIComponent(email)}&return_to=${encodeURIComponent(returnTo)}`);

    try {
      await sendMagicLink({ identifier: email, redirectUrl });
      goToCheckEmail();
      return;
    } catch (error) {
      const signUpClient = deps?.signUp ?? signUp;
      if (!isFormIdentifierNotFound(error) || !signUpClient) {
        setResendState(isRateLimited(error) ? "error-rate-limited" : "error-sign-in-failed");
        return;
      }

      try {
        await signUpClient.create({ emailAddress: email });
        await signUpClient.prepareEmailAddressVerification({ strategy: "email_link", redirectUrl: signUpRedirectUrl });
        goToCheckEmail();
      } catch (signUpError) {
        setResendState(isRateLimited(signUpError) ? "error-rate-limited" : "error-sign-in-failed");
      }
    }
  };

  if (screenState === "verified-elsewhere") {
    return <MagicLinkInvalidScreen state="verified-elsewhere" onSendNewLink={handleSendNewLink} strings={strings} />;
  }

  if (screenState === "verified-elsewhere-unconfirmed") {
    // No destructive resend handle here — there is no established session anywhere for a
    // sign-up attempt to supersede, but there's also nothing to confirm, so the only CTA is a
    // non-destructive path back rather than the sign-in branch's resend.
    return (
      <MagicLinkInvalidScreen
        state="verified-elsewhere-unconfirmed"
        onSendNewLink={() => {}}
        onBackToLogin={() => router.replace("/login")}
        strings={strings}
      />
    );
  }

  if (screenState === "invalid") {
    const state = resendState === "idle" ? "default" : resendState;
    return <MagicLinkInvalidScreen state={state} onSendNewLink={handleSendNewLink} strings={strings} />;
  }

  return (
    <div className="flex justify-center py-16">
      <Spinner />
    </div>
  );
}
