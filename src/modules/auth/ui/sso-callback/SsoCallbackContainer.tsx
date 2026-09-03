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
  deps?: SsoCallbackDeps;
  strings?: Partial<MagicLinkInvalidScreenStrings>;
};

function isInvalidEmailLink(error: unknown): boolean {
  if (!isEmailLinkError(error as Error)) {
    return false;
  }
  const code = (error as { code?: string }).code;
  return (
    code === EmailLinkErrorCodeStatus.Expired ||
    code === EmailLinkErrorCodeStatus.Failed ||
    code === EmailLinkErrorCodeStatus.ClientMismatch
  );
}

function isRateLimited(error: unknown): boolean {
  return isClerkAPIResponseError(error as Error) && (error as { status?: number }).status === 429;
}

function isFormIdentifierNotFound(error: unknown): boolean {
  const errors = (error as { errors?: { code?: string }[] } | undefined)?.errors;
  return Boolean(errors?.some((entry) => entry.code === "form_identifier_not_found"));
}

export function SsoCallbackContainer({ returnTo, flow = "oauth", email, deps, strings }: SsoCallbackContainerProps) {
  const router = useRouter();
  const clerk = useClerk();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const [linkInvalid, setLinkInvalid] = useState(false);
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
        // this callback — this device never gets a session, so it must not navigate to returnTo.
        onVerifiedOnOtherDevice: () => setLinkInvalid(true),
      }).catch((error) => {
        if (isInvalidEmailLink(error)) {
          setLinkInvalid(true);
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
    const sendMagicLink = deps?.sendMagicLink ?? ((opts) => signIn!.create({ ...opts, strategy: "email_link" }));
    const redirectUrl = `${window.location.origin}/sso-callback?return_to=${encodeURIComponent(returnTo)}&flow=email_link&email=${encodeURIComponent(email)}`;

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
        await signUpClient.prepareEmailAddressVerification({ strategy: "email_link", redirectUrl });
        goToCheckEmail();
      } catch (signUpError) {
        setResendState(isRateLimited(signUpError) ? "error-rate-limited" : "error-sign-in-failed");
      }
    }
  };

  if (linkInvalid) {
    const state = resendState === "idle" ? "default" : resendState;
    return <MagicLinkInvalidScreen state={state} onSendNewLink={handleSendNewLink} strings={strings} />;
  }

  return (
    <div className="flex justify-center py-16">
      <Spinner />
    </div>
  );
}
