"use client";

import { useSignIn, useSignUp } from "@clerk/nextjs/legacy";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { useState } from "react";
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

export function CheckEmailContainer({ email, returnTo, strings }: CheckEmailContainerProps) {
  const { signIn, isLoaded } = useSignIn();
  const { signUp, isLoaded: isSignUpLoaded } = useSignUp();
  const [state, setState] = useState<CheckEmailScreenState>("default");

  const handleResend = async () => {
    if (!isLoaded) {
      return;
    }
    setState("loading");
    const redirectUrl = `${window.location.origin}/sso-callback?return_to=${encodeURIComponent(returnTo)}&flow=email_link&email=${encodeURIComponent(email)}`;

    try {
      await signIn.create({ identifier: email, strategy: "email_link", redirectUrl });
      setState("resent-confirmation");
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
