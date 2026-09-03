"use client";

import { useSignIn, useSignUp } from "@clerk/nextjs/legacy";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoginScreen, type LoginScreenState, type LoginScreenStrings } from "./LoginScreen";

export type LoginContainerProps = {
  heading: string;
  returnTo: string;
  initialState: LoginScreenState;
  strings?: Partial<LoginScreenStrings>;
};

function isFormIdentifierNotFound(error: unknown): boolean {
  const errors = (error as { errors?: { code?: string }[] } | undefined)?.errors;
  return Boolean(errors?.some((entry) => entry.code === "form_identifier_not_found"));
}

export function LoginContainer({ heading, returnTo, initialState, strings }: LoginContainerProps) {
  const { signIn, isLoaded } = useSignIn();
  const { signUp, isLoaded: isSignUpLoaded } = useSignUp();
  const router = useRouter();
  const [state, setState] = useState<LoginScreenState>(initialState);
  const [loadingProvider, setLoadingProvider] = useState<"google" | "github" | "email">();
  const [email, setEmail] = useState("");

  const withOAuth = (strategy: "oauth_google" | "oauth_github", provider: "google" | "github") => async () => {
    if (!isLoaded) {
      return;
    }
    setLoadingProvider(provider);
    setState("loading");
    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: `/sso-callback?return_to=${encodeURIComponent(returnTo)}`,
        redirectUrlComplete: returnTo,
      });
    } catch {
      setState("error-sign-in-failed");
    }
  };

  const handleSendMagicLink = async () => {
    if (!isLoaded) {
      return;
    }
    setLoadingProvider("email");
    setState("loading");
    const redirectUrl = `${window.location.origin}/sso-callback?return_to=${encodeURIComponent(returnTo)}&flow=email_link&email=${encodeURIComponent(email)}`;
    try {
      await signIn.create({ identifier: email, strategy: "email_link", redirectUrl });
      router.push(`/check-email?email=${encodeURIComponent(email)}&return_to=${encodeURIComponent(returnTo)}`);
      return;
    } catch (error) {
      if (!isFormIdentifierNotFound(error) || !isSignUpLoaded) {
        setState("error-sign-in-failed");
        return;
      }
    }

    try {
      await signUp.create({ emailAddress: email });
      await signUp.prepareEmailAddressVerification({ strategy: "email_link", redirectUrl });
      router.push(`/check-email?email=${encodeURIComponent(email)}&return_to=${encodeURIComponent(returnTo)}`);
    } catch {
      setState("error-sign-in-failed");
    }
  };

  return (
    <LoginScreen
      state={state}
      heading={heading}
      email={email}
      onEmailChange={setEmail}
      onGoogleClick={withOAuth("oauth_google", "google")}
      onGithubClick={withOAuth("oauth_github", "github")}
      onSendMagicLink={handleSendMagicLink}
      loadingProvider={loadingProvider}
      strings={strings}
    />
  );
}
