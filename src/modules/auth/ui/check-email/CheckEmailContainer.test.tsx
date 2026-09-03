import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { CheckEmailContainer } from "./CheckEmailContainer";

const signInCreate = vi.fn();
const signUpCreate = vi.fn();
const signUpPrepareEmailAddressVerification = vi.fn();
const setActive = vi.fn();
const replace = vi.fn();

// A pollable signIn whose poll never settles — matches the realistic default shape (a
// signIn.create({ identifier }) attempt normally supports email_link), for tests that aren't
// exercising the poll's outcome. Reassigned per test by the describe blocks below.
function pendingPoll() {
  return { startEmailLinkFlow: vi.fn().mockReturnValue(new Promise(() => {})), cancelEmailLinkFlow: vi.fn() };
}
function defaultPollableSignIn(): Record<string, unknown> {
  return {
    create: signInCreate,
    status: "needs_first_factor",
    supportedFirstFactors: [{ strategy: "email_link", emailAddressId: "idn_default" }],
    createEmailLinkFlow: () => pendingPoll(),
  };
}
let signInValue: Record<string, unknown> = defaultPollableSignIn();

vi.mock("@clerk/nextjs/legacy", () => ({
  useSignIn: () => ({
    isLoaded: true,
    signIn: signInValue,
  }),
  useSignUp: () => ({
    isLoaded: true,
    signUp: { create: signUpCreate, prepareEmailAddressVerification: signUpPrepareEmailAddressVerification },
  }),
}));

vi.mock("@clerk/nextjs", () => ({
  useClerk: () => ({ setActive }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

// isClerkAPIResponseError (from @clerk/nextjs/errors) checks target.constructor?.kind ===
// "ClerkAPIResponseError" (the real ClerkAPIResponseError class's static `kind` field) OR
// `instanceof` — see @clerk/shared's createErrorTypeGuard. Faking the constructor.kind matches
// the real runtime check without needing @clerk/shared as a direct dependency.
function clerkApiError(status: number, code: string): Error & { status: number; errors: { code: string }[] } {
  const error = Object.assign(new Error(code), { name: "ClerkAPIResponseError", status, errors: [{ code }] });
  Object.defineProperty(error, "constructor", { value: { kind: "ClerkAPIResponseError" } });
  return error;
}

describe("CheckEmailContainer", () => {
  beforeEach(() => {
    signInCreate.mockReset();
    signUpCreate.mockReset();
    signUpPrepareEmailAddressVerification.mockReset();
    setActive.mockReset();
    replace.mockReset();
    signInValue = defaultPollableSignIn();
  });

  it("resends the magic link and shows the confirmation", async () => {
    signInCreate.mockResolvedValue({});
    render(<CheckEmailContainer email="traveler@example.test" returnTo="/dashboard/trips/123" />);

    await userEvent.click(screen.getByRole("button", { name: "Resend" }));

    // The actual send now happens via startEmailLinkFlow (so the resent attempt is polled
    // for cross-device completion too) — create() here only re-resolves the identifier.
    expect(signInCreate).toHaveBeenCalledWith({ identifier: "traveler@example.test" });
    expect(await screen.findByText(/link resent/i)).toBeInTheDocument();
  });

  it("shows the rate-limit error only on a real 429 ClerkAPIResponseError", async () => {
    signInCreate.mockRejectedValue(clerkApiError(429, "too_many_requests"));
    render(<CheckEmailContainer email="traveler@example.test" returnTo="/dashboard" />);

    await userEvent.click(screen.getByRole("button", { name: "Resend" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/too many requests/i);
  });

  it("shows a distinct generic error (not rate-limited) for a network/other failure", async () => {
    signInCreate.mockRejectedValue(new Error("network down"));
    render(<CheckEmailContainer email="traveler@example.test" returnTo="/dashboard" />);

    await userEvent.click(screen.getByRole("button", { name: "Resend" }));

    const alert = await screen.findByRole("alert");
    expect(alert).not.toHaveTextContent(/too many requests/i);
  });

  it("falls back to sign-up when the email is a first-time identifier (form_identifier_not_found)", async () => {
    signInCreate.mockRejectedValue(clerkApiError(422, "form_identifier_not_found"));
    signUpCreate.mockResolvedValue({});
    signUpPrepareEmailAddressVerification.mockResolvedValue({});
    render(<CheckEmailContainer email="new-traveler@example.test" returnTo="/dashboard" />);

    await userEvent.click(screen.getByRole("button", { name: "Resend" }));

    expect(signUpCreate).toHaveBeenCalledWith({ emailAddress: "new-traveler@example.test" });
    expect(signUpPrepareEmailAddressVerification).toHaveBeenCalledWith(
      expect.objectContaining({ strategy: "email_link" }),
    );
    expect(await screen.findByText(/link resent/i)).toBeInTheDocument();
  });

  describe("cross-device completion (AC-02b)", () => {
    it("polls the pending sign-in attempt on mount and redirects to returnTo once it completes elsewhere", async () => {
      const startEmailLinkFlow = vi.fn().mockResolvedValue({ status: "complete", createdSessionId: "sess_1" });
      const cancelEmailLinkFlow = vi.fn();
      signInValue = {
        create: signInCreate,
        status: "needs_first_factor",
        supportedFirstFactors: [{ strategy: "email_link", emailAddressId: "idn_1" }],
        createEmailLinkFlow: () => ({ startEmailLinkFlow, cancelEmailLinkFlow }),
      };

      render(<CheckEmailContainer email="traveler@example.test" returnTo="/dashboard/trips/123" />);

      expect(startEmailLinkFlow).toHaveBeenCalledWith(
        expect.objectContaining({ emailAddressId: "idn_1", redirectUrl: expect.stringContaining("/sso-callback") }),
      );
      await waitFor(() => expect(setActive).toHaveBeenCalledWith({ session: "sess_1" }));
      expect(replace).toHaveBeenCalledWith("/dashboard/trips/123");
    });

    it("shows a visible error instead of waiting forever when the polled attempt expires (real SDK: firstFactorVerification.status, not signIn.status)", async () => {
      const startEmailLinkFlow = vi
        .fn()
        .mockResolvedValue({ status: "needs_first_factor", firstFactorVerification: { status: "expired" } });
      signInValue = {
        create: signInCreate,
        status: "needs_first_factor",
        supportedFirstFactors: [{ strategy: "email_link", emailAddressId: "idn_1" }],
        createEmailLinkFlow: () => ({ startEmailLinkFlow, cancelEmailLinkFlow: vi.fn() }),
      };

      render(<CheckEmailContainer email="traveler@example.test" returnTo="/dashboard" />);

      expect(await screen.findByRole("alert")).toBeInTheDocument();
      expect(replace).not.toHaveBeenCalled();
    });

    it("cancels the poll on unmount instead of leaving it running", () => {
      const cancelEmailLinkFlow = vi.fn();
      signInValue = {
        create: signInCreate,
        status: "needs_first_factor",
        supportedFirstFactors: [{ strategy: "email_link", emailAddressId: "idn_1" }],
        createEmailLinkFlow: () => ({ startEmailLinkFlow: vi.fn().mockReturnValue(new Promise(() => {})), cancelEmailLinkFlow }),
      };

      const { unmount } = render(<CheckEmailContainer email="traveler@example.test" returnTo="/dashboard" />);
      unmount();

      expect(cancelEmailLinkFlow).toHaveBeenCalled();
    });

    it("ignores a poll settlement that arrives after the component has already unmounted", async () => {
      let resolveIt: (value: { status: string; createdSessionId: string }) => void = () => {};
      const pending = new Promise<{ status: string; createdSessionId: string }>((resolve) => {
        resolveIt = resolve;
      });
      signInValue = {
        create: signInCreate,
        status: "needs_first_factor",
        supportedFirstFactors: [{ strategy: "email_link", emailAddressId: "idn_1" }],
        createEmailLinkFlow: () => ({ startEmailLinkFlow: () => pending, cancelEmailLinkFlow: vi.fn() }),
      };

      const { unmount } = render(<CheckEmailContainer email="traveler@example.test" returnTo="/dashboard" />);
      unmount();
      resolveIt({ status: "complete", createdSessionId: "sess_1" });
      await Promise.resolve();
      await Promise.resolve();

      expect(setActive).not.toHaveBeenCalled();
      expect(replace).not.toHaveBeenCalled();
    });

    it("does not let a resend-cancelled poll's stale settlement clobber the resend's own state", async () => {
      let resolveStale: (value: { status: string }) => void = () => {};
      const stale = new Promise<{ status: string }>((resolve) => {
        resolveStale = resolve;
      });
      let createCalls = 0;
      signInValue = {
        create: signInCreate,
        status: "needs_first_factor",
        supportedFirstFactors: [{ strategy: "email_link", emailAddressId: "idn_1" }],
        createEmailLinkFlow: () => {
          createCalls += 1;
          return createCalls === 1
            ? { startEmailLinkFlow: () => stale, cancelEmailLinkFlow: vi.fn() }
            : { startEmailLinkFlow: vi.fn().mockReturnValue(new Promise(() => {})), cancelEmailLinkFlow: vi.fn() };
        },
      };
      signInCreate.mockResolvedValue({});

      render(<CheckEmailContainer email="traveler@example.test" returnTo="/dashboard/trips/123" />);
      await userEvent.click(screen.getByRole("button", { name: "Resend" }));
      expect(await screen.findByText(/link resent/i)).toBeInTheDocument();

      // The first (mount-time) poll — cancelled by the resend — settles late with a failure.
      // It must not overwrite the resend's "Link resent" confirmation.
      resolveStale({ status: "expired" });
      await Promise.resolve();
      await Promise.resolve();

      expect(screen.getByText(/link resent/i)).toBeInTheDocument();
    });

    it("shows a visible error, not a silent 'link sent' claim, when the attempt has no createEmailLinkFlow support", () => {
      signInValue = { create: signInCreate, status: "needs_first_factor" };

      render(<CheckEmailContainer email="traveler@example.test" returnTo="/dashboard" />);

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(setActive).not.toHaveBeenCalled();
      expect(replace).not.toHaveBeenCalled();
    });

    it("shows a visible error, not a silent 'link sent' claim, when the attempt has no email_link first factor", () => {
      signInValue = {
        create: signInCreate,
        status: "needs_first_factor",
        supportedFirstFactors: [{ strategy: "oauth_google" }],
        createEmailLinkFlow: () => ({ startEmailLinkFlow: vi.fn(), cancelEmailLinkFlow: vi.fn() }),
      };

      render(<CheckEmailContainer email="traveler@example.test" returnTo="/dashboard" />);

      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });
});
