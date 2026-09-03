import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EmailLinkErrorCodeStatus } from "@clerk/nextjs/errors";
import { SsoCallbackContainer } from "./SsoCallbackContainer";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@clerk/nextjs", () => ({
  useClerk: () => ({ handleRedirectCallback: vi.fn(), handleEmailLinkVerification: vi.fn() }),
}));

vi.mock("@clerk/nextjs/legacy", () => ({
  useSignIn: () => ({ signIn: { create: vi.fn() } }),
}));

afterEach(() => {
  replace.mockClear();
});

function emailLinkError(code: string): Error {
  return Object.assign(new Error(code), { name: "EmailLinkError", code });
}

describe("SsoCallbackContainer — oauth flow (default)", () => {
  it("shows a spinner while completing the redirect", () => {
    const handleRedirectCallback = vi.fn().mockReturnValue(new Promise(() => {}));
    render(<SsoCallbackContainer returnTo="/dashboard" deps={{ handleRedirectCallback } as never} />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(handleRedirectCallback).toHaveBeenCalledWith({
      signInFallbackRedirectUrl: "/dashboard",
      signUpFallbackRedirectUrl: "/dashboard",
    });
  });

  it("redirects to /login?error=sign_in_failed when the callback fails", async () => {
    const handleRedirectCallback = vi.fn().mockRejectedValue(new Error("oauth failed"));
    render(<SsoCallbackContainer returnTo="/dashboard" deps={{ handleRedirectCallback } as never} />);

    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith("/login?error=sign_in_failed"));
  });
});

describe("SsoCallbackContainer — email-link flow", () => {
  it("calls handleEmailLinkVerification (not handleRedirectCallback) with redirectUrlComplete and onVerifiedOnOtherDevice", () => {
    const handleEmailLinkVerification = vi.fn().mockReturnValue(new Promise(() => {}));
    const handleRedirectCallback = vi.fn();
    render(
      <SsoCallbackContainer
        returnTo="/dashboard"
        flow="email_link"
        deps={{ handleEmailLinkVerification, handleRedirectCallback } as never}
      />,
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(handleRedirectCallback).not.toHaveBeenCalled();
    expect(handleEmailLinkVerification).toHaveBeenCalledWith(
      expect.objectContaining({ redirectUrlComplete: "/dashboard", onVerifiedOnOtherDevice: expect.any(Function) }),
    );
  });

  it("renders SCR-04 (magic-link-invalid) on a real EmailLinkError with code=expired, instead of redirecting", async () => {
    const handleEmailLinkVerification = vi.fn().mockRejectedValue(emailLinkError(EmailLinkErrorCodeStatus.Expired));
    render(
      <SsoCallbackContainer
        returnTo="/dashboard"
        flow="email_link"
        deps={{ handleEmailLinkVerification } as never}
      />,
    );

    expect(await screen.findByText(/no longer valid/i)).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("renders SCR-04 with the strings passed down from the page (i18n), not hardcoded English", async () => {
    const handleEmailLinkVerification = vi.fn().mockRejectedValue(emailLinkError(EmailLinkErrorCodeStatus.Expired));
    render(
      <SsoCallbackContainer
        returnTo="/dashboard"
        flow="email_link"
        deps={{ handleEmailLinkVerification } as never}
        strings={{ heading: "Посилання більше не дійсне" }}
      />,
    );

    expect(await screen.findByText("Посилання більше не дійсне")).toBeInTheDocument();
  });

  it("renders SCR-04 on a real EmailLinkError with code=failed", async () => {
    const handleEmailLinkVerification = vi.fn().mockRejectedValue(emailLinkError(EmailLinkErrorCodeStatus.Failed));
    render(
      <SsoCallbackContainer
        returnTo="/dashboard"
        flow="email_link"
        deps={{ handleEmailLinkVerification } as never}
      />,
    );

    expect(await screen.findByText(/no longer valid/i)).toBeInTheDocument();
  });

  it("redirects to /login?error=sign_in_failed on a client_mismatch EmailLinkError, not SCR-04", async () => {
    const handleEmailLinkVerification = vi
      .fn()
      .mockRejectedValue(emailLinkError(EmailLinkErrorCodeStatus.ClientMismatch));
    render(
      <SsoCallbackContainer
        returnTo="/dashboard"
        flow="email_link"
        deps={{ handleEmailLinkVerification } as never}
      />,
    );

    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith("/login?error=sign_in_failed"));
  });

  it("redirects to /login?error=sign_in_failed on a non-EmailLinkError rejection", async () => {
    const handleEmailLinkVerification = vi.fn().mockRejectedValue(new Error("network error"));
    render(
      <SsoCallbackContainer
        returnTo="/dashboard"
        flow="email_link"
        deps={{ handleEmailLinkVerification } as never}
      />,
    );

    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith("/login?error=sign_in_failed"));
  });

  it("re-sends the magic link (carrying the known email and returnTo) when 'Send a new link' is clicked, instead of navigating to /login", async () => {
    const handleEmailLinkVerification = vi.fn().mockRejectedValue(emailLinkError(EmailLinkErrorCodeStatus.Expired));
    const sendMagicLink = vi.fn().mockReturnValue(new Promise(() => {}));
    render(
      <SsoCallbackContainer
        returnTo="/dashboard/trips/1"
        flow="email_link"
        email="traveler@example.test"
        deps={{ handleEmailLinkVerification, sendMagicLink } as never}
      />,
    );

    await screen.findByText(/no longer valid/i);
    await userEvent.click(screen.getByRole("button", { name: /send a new link/i }));

    expect(sendMagicLink).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: "traveler@example.test",
        redirectUrl: expect.stringContaining(encodeURIComponent("/dashboard/trips/1")),
      }),
    );
    expect(replace).not.toHaveBeenCalledWith("/login");
  });

  it("shows the loading state while the new link is being sent", async () => {
    const handleEmailLinkVerification = vi.fn().mockRejectedValue(emailLinkError(EmailLinkErrorCodeStatus.Expired));
    const sendMagicLink = vi.fn().mockReturnValue(new Promise(() => {}));
    render(
      <SsoCallbackContainer
        returnTo="/dashboard"
        flow="email_link"
        email="traveler@example.test"
        deps={{ handleEmailLinkVerification, sendMagicLink } as never}
      />,
    );

    await screen.findByText(/no longer valid/i);
    await userEvent.click(screen.getByRole("button", { name: /send a new link/i }));

    expect(screen.getByRole("button", { name: /send a new link/i })).toBeDisabled();
  });

  it("shows error-rate-limited on a real 429 when re-sending the new link", async () => {
    const handleEmailLinkVerification = vi.fn().mockRejectedValue(emailLinkError(EmailLinkErrorCodeStatus.Expired));
    const rateLimitError = Object.assign(new Error("too_many_requests"), { status: 429 });
    Object.defineProperty(rateLimitError, "constructor", { value: { kind: "ClerkAPIResponseError" } });
    const sendMagicLink = vi.fn().mockRejectedValue(rateLimitError);
    render(
      <SsoCallbackContainer
        returnTo="/dashboard"
        flow="email_link"
        email="traveler@example.test"
        deps={{ handleEmailLinkVerification, sendMagicLink } as never}
      />,
    );

    await screen.findByText(/no longer valid/i);
    await userEvent.click(screen.getByRole("button", { name: /send a new link/i }));

    expect(await screen.findByText(/too many requests/i)).toBeInTheDocument();
  });

  it("navigates to returnTo when onVerifiedOnOtherDevice fires", () => {
    let capturedOpts: { onVerifiedOnOtherDevice?: () => void } = {};
    const handleEmailLinkVerification = vi.fn().mockImplementation((opts) => {
      capturedOpts = opts;
      return new Promise(() => {});
    });
    render(
      <SsoCallbackContainer
        returnTo="/dashboard/trips/1"
        flow="email_link"
        deps={{ handleEmailLinkVerification } as never}
      />,
    );

    capturedOpts.onVerifiedOnOtherDevice?.();
    expect(replace).toHaveBeenCalledWith("/dashboard/trips/1");
  });
});
