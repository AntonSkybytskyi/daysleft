"use client";

import { useClerk } from "@clerk/nextjs";
import { EmailLinkErrorCodeStatus, isEmailLinkError } from "@clerk/nextjs/errors";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Spinner } from "@/modules/ui/Spinner/Spinner";
import { MagicLinkInvalidScreen } from "@/modules/auth/ui/magic-link-invalid/MagicLinkInvalidScreen";

export type SsoCallbackDeps = {
  handleRedirectCallback: (opts: {
    signInFallbackRedirectUrl: string;
    signUpFallbackRedirectUrl: string;
  }) => Promise<unknown>;
  handleEmailLinkVerification: (opts: {
    redirectUrlComplete: string;
    onVerifiedOnOtherDevice?: () => void;
  }) => Promise<unknown>;
};

export type SsoCallbackContainerProps = {
  returnTo: string;
  flow?: "email_link" | "oauth";
  deps?: SsoCallbackDeps;
};

function isInvalidEmailLink(error: unknown): boolean {
  if (!isEmailLinkError(error as Error)) {
    return false;
  }
  const code = (error as { code?: string }).code;
  return code === EmailLinkErrorCodeStatus.Expired || code === EmailLinkErrorCodeStatus.Failed;
}

export function SsoCallbackContainer({ returnTo, flow = "oauth", deps }: SsoCallbackContainerProps) {
  const router = useRouter();
  const clerk = useClerk();
  const [linkInvalid, setLinkInvalid] = useState(false);

  useEffect(() => {
    if (flow === "email_link") {
      const handleEmailLinkVerification =
        deps?.handleEmailLinkVerification ?? ((opts) => clerk.handleEmailLinkVerification(opts));

      handleEmailLinkVerification({
        redirectUrlComplete: returnTo,
        onVerifiedOnOtherDevice: () => router.replace(returnTo),
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

  if (linkInvalid) {
    return <MagicLinkInvalidScreen state="default" onSendNewLink={() => router.replace("/login")} />;
  }

  return (
    <div className="flex justify-center py-16">
      <Spinner />
    </div>
  );
}
