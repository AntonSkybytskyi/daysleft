"use client";

import { useSignIn } from "@clerk/nextjs/legacy";
import { useState } from "react";
import { CheckEmailScreen, type CheckEmailScreenState, type CheckEmailScreenStrings } from "./CheckEmailScreen";

export type CheckEmailContainerProps = {
  email: string;
  strings?: Partial<CheckEmailScreenStrings>;
};

export function CheckEmailContainer({ email, strings }: CheckEmailContainerProps) {
  const { signIn, isLoaded } = useSignIn();
  const [state, setState] = useState<CheckEmailScreenState>("default");

  const handleResend = async () => {
    if (!isLoaded) {
      return;
    }
    setState("loading");
    try {
      await signIn.create({
        identifier: email,
        strategy: "email_link",
        redirectUrl: `${window.location.origin}/sso-callback`,
      });
      setState("resent-confirmation");
    } catch {
      setState("error-rate-limited");
    }
  };

  return <CheckEmailScreen state={state} email={email} onResend={handleResend} strings={strings} />;
}
