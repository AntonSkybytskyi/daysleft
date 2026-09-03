import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { CheckEmailContainer } from "./CheckEmailContainer";

const signInCreate = vi.fn();
const signUpCreate = vi.fn();
const signUpPrepareEmailAddressVerification = vi.fn();

vi.mock("@clerk/nextjs/legacy", () => ({
  useSignIn: () => ({
    isLoaded: true,
    signIn: { create: signInCreate },
  }),
  useSignUp: () => ({
    isLoaded: true,
    signUp: { create: signUpCreate, prepareEmailAddressVerification: signUpPrepareEmailAddressVerification },
  }),
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
  });

  it("resends the magic link with the same return_to as the original send, and shows the confirmation", async () => {
    signInCreate.mockResolvedValue({});
    render(<CheckEmailContainer email="traveler@example.test" returnTo="/dashboard/trips/123" />);

    await userEvent.click(screen.getByRole("button", { name: "Resend" }));

    expect(signInCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: "traveler@example.test",
        strategy: "email_link",
        redirectUrl: expect.stringMatching(/\/sso-callback\?.*return_to=%2Fdashboard%2Ftrips%2F123.*flow=email_link/),
      }),
    );
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
});
