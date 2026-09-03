"use client";

import { useClerk } from "@clerk/nextjs";
import { useSignIn, useSignUp } from "@clerk/nextjs/legacy";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CheckEmailScreen, type CheckEmailScreenState, type CheckEmailScreenStrings } from "./CheckEmailScreen";

export type CheckEmailContainerProps = {
  email: string;
  returnTo: string;
  strings?: Partial<CheckEmailScreenStrings>;
};

function isFormIdentifierNotFound(error: unknown): boolean {
  const errors = (error as { errors?: { code?: string }[] } | undefined)?.errors;
  return Boolean(errors?.some((entry) => entry.code === "form_identifier_not_found"));
}

function isRateLimited(error: unknown): boolean {
  return isClerkAPIResponseError(error as Error) && (error as { status?: number }).status === 429;
}

type PollableSignIn = {
  status?: string;
  supportedFirstFactors?: { strategy?: string; emailAddressId?: string }[] | null;
  createEmailLinkFlow?: () => {
    startEmailLinkFlow: (opts: {
      emailAddressId: string;
      redirectUrl: string;
    }) => Promise<{ status?: string; createdSessionId?: string | null }>;
    cancelEmailLinkFlow: () => void;
  };
};

export function CheckEmailContainer({ email, returnTo, strings }: CheckEmailContainerProps) {
  const router = useRouter();
  const { setActive } = useClerk();
  const { signIn, isLoaded } = useSignIn();
  const { signUp, isLoaded: isSignUpLoaded } = useSignUp();
  const [state, setState] = useState<CheckEmailScreenState>("default");
  const cancelPollRef = useRef<(() => void) | undefined>();

  // AC-02b: the whole point of this screen is that the link gets opened on a DIFFERENT
  // device than this one. Clerk's email-link flow completes the sign-in on the device that
  // created the attempt (this one) once it detects the link was verified elsewhere — but
  // only if this device is actively polling for it via createEmailLinkFlow. Without this,
  // the Traveler is left here indefinitely with no way to discover the link already worked.
  const pollForCompletion = (target: PollableSignIn | undefined) => {
    if (!target || target.status !== "needs_first_factor" || !target.createEmailLinkFlow) {
      return;
    }
    const emailAddressId = target.supportedFirstFactors?.find((factor) => factor.strategy === "email_link")
      ?.emailAddressId;
    if (!emailAddressId) {
      return;
    }
    const redirectUrl = `${window.location.origin}/sso-callback?return_to=${encodeURIComponent(returnTo)}&flow=email_link&email=${encodeURIComponent(email)}`;
    const { startEmailLinkFlow, cancelEmailLinkFlow } = target.createEmailLinkFlow();
    cancelPollRef.current = cancelEmailLinkFlow;

    startEmailLinkFlow({ emailAddressId, redirectUrl })
      .then(async (result) => {
        if (result.status === "complete" && result.createdSessionId) {
          await setActive({ session: result.createdSessionId });
          router.replace(returnTo);
          return;
        }
        // Verified-but-not-complete, expired, or any other terminal status short of
        // "complete" — the Traveler needs a fresh link, not an indefinite wait.
        setState("error-sign-in-failed");
      })
      .catch((error: unknown) => {
        setState(isRateLimited(error) ? "error-rate-limited" : "error-sign-in-failed");
      });
  };

  useEffect(() => {
    if (!isLoaded) {
      return;
    }
    pollForCompletion(signIn as unknown as PollableSignIn);
    return () => {
      cancelPollRef.current?.();
    };
    // Starts once per mount for the signIn resource this screen was navigated for.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  const handleResend = async () => {
    if (!isLoaded) {
      return;
    }
    cancelPollRef.current?.();
    setState("loading");
    const redirectUrl = `${window.location.origin}/sso-callback?return_to=${encodeURIComponent(returnTo)}&flow=email_link&email=${encodeURIComponent(email)}`;

    try {
      await signIn.create({ identifier: email });
      setState("resent-confirmation");
      pollForCompletion(signIn as unknown as PollableSignIn);
      return;
    } catch (error) {
      if (!isFormIdentifierNotFound(error) || !isSignUpLoaded) {
        setState(isRateLimited(error) ? "error-rate-limited" : "error-sign-in-failed");
        return;
      }
    }

    try {
      await signUp.create({ emailAddress: email });
      await signUp.prepareEmailAddressVerification({ strategy: "email_link", redirectUrl });
      setState("resent-confirmation");
    } catch (error) {
      setState(isRateLimited(error) ? "error-rate-limited" : "error-sign-in-failed");
    }
  };

  return <CheckEmailScreen state={state} email={email} onResend={handleResend} strings={strings} />;
}
