"use client";

import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Spinner } from "@/modules/ui/Spinner/Spinner";
import { MagicLinkInvalidScreen } from "@/modules/auth/ui/magic-link-invalid/MagicLinkInvalidScreen";

export type SsoCallbackDeps = {
  handleRedirectCallback: (opts: {
    signInFallbackRedirectUrl: string;
    signUpFallbackRedirectUrl: string;
  }) => Promise<unknown>;
};

export type SsoCallbackContainerProps = {
  returnTo: string;
  deps?: SsoCallbackDeps;
};

const expiredOrUsedCodes = new Set([
  "verification_expired",
  "verification_already_verified",
  "verification_failed",
]);

function isExpiredOrUsedLink(error: unknown): boolean {
  const errors = (error as { errors?: { code?: string }[] } | undefined)?.errors;
  return Boolean(errors?.some((entry) => entry.code && expiredOrUsedCodes.has(entry.code)));
}

export function SsoCallbackContainer({ returnTo, deps }: SsoCallbackContainerProps) {
  const router = useRouter();
  const clerk = useClerk();
  const [linkInvalid, setLinkInvalid] = useState(false);

  useEffect(() => {
    const handleRedirectCallback = deps?.handleRedirectCallback ?? ((opts) => clerk.handleRedirectCallback(opts));

    handleRedirectCallback({ signInFallbackRedirectUrl: returnTo, signUpFallbackRedirectUrl: returnTo }).catch(
      (error) => {
        if (isExpiredOrUsedLink(error)) {
          setLinkInvalid(true);
          return;
        }
        router.replace("/login?error=sign_in_failed");
      },
    );
    // Runs once for this callback visit — returnTo/deps/router/clerk are stable for the page's lifetime.
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
