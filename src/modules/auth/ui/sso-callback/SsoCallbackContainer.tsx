"use client";

import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@/modules/ui/Spinner/Spinner";

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

export function SsoCallbackContainer({ returnTo, deps }: SsoCallbackContainerProps) {
  const router = useRouter();
  const clerk = useClerk();

  useEffect(() => {
    const handleRedirectCallback = deps?.handleRedirectCallback ?? ((opts) => clerk.handleRedirectCallback(opts));

    handleRedirectCallback({ signInFallbackRedirectUrl: returnTo, signUpFallbackRedirectUrl: returnTo }).catch(() => {
      router.replace("/login?error=sign_in_failed");
    });
    // Runs once for this callback visit — returnTo/deps/router/clerk are stable for the page's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex justify-center py-16">
      <Spinner />
    </div>
  );
}
