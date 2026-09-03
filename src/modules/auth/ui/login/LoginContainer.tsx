"use client";

import { useSignIn } from "@clerk/nextjs/legacy";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoginScreen, type LoginScreenState } from "./LoginScreen";

export type LoginContainerProps = {
  heading: string;
  returnTo: string;
  initialState: LoginScreenState;
};

export function LoginContainer({ heading, returnTo, initialState }: LoginContainerProps) {
  const { signIn, isLoaded } = useSignIn();
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
        redirectUrl: "/sso-callback",
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
    try {
      await signIn.create({
        identifier: email,
        strategy: "email_link",
        redirectUrl: `${window.location.origin}/sso-callback`,
      });
      router.push(`/check-email?email=${encodeURIComponent(email)}`);
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
    />
  );
}
