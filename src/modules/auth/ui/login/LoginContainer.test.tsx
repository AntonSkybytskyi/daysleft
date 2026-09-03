import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginContainer } from "./LoginContainer";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const signInCreate = vi.fn();
const signUpCreate = vi.fn();
const prepareEmailAddressVerification = vi.fn();

vi.mock("@clerk/nextjs/legacy", () => ({
  useSignIn: () => ({ isLoaded: true, signIn: { create: signInCreate, authenticateWithRedirect: vi.fn() } }),
  useSignUp: () => ({
    isLoaded: true,
    signUp: { create: signUpCreate, prepareEmailAddressVerification },
  }),
}));

function baseProps() {
  return { heading: "Sign in to daysleft", returnTo: "/dashboard", initialState: "default" as const };
}

describe("LoginContainer — magic-link sign-up fallback", () => {
  beforeEach(() => {
    signInCreate.mockReset();
    signUpCreate.mockReset();
    prepareEmailAddressVerification.mockReset();
    push.mockClear();
  });

  it("falls back to sign-up when the email has no existing account", async () => {
    signInCreate.mockRejectedValue({ errors: [{ code: "form_identifier_not_found" }] });
    signUpCreate.mockResolvedValue({});
    prepareEmailAddressVerification.mockResolvedValue({});

    render(<LoginContainer {...baseProps()} />);
    await userEvent.type(screen.getByLabelText("Email"), "new-traveler@example.test");
    await userEvent.click(screen.getByRole("button", { name: "Send magic link" }));

    expect(signUpCreate).toHaveBeenCalledWith(expect.objectContaining({ emailAddress: "new-traveler@example.test" }));
    expect(prepareEmailAddressVerification).toHaveBeenCalledWith(
      expect.objectContaining({ strategy: "email_link" }),
    );
    expect(push).toHaveBeenCalledWith(`/check-email?email=${encodeURIComponent("new-traveler@example.test")}`);
  });

  it("shows the generic sign-in-failed error for any other sign-in failure", async () => {
    signInCreate.mockRejectedValue({ errors: [{ code: "form_password_incorrect" }] });

    render(<LoginContainer {...baseProps()} />);
    await userEvent.type(screen.getByLabelText("Email"), "traveler@example.test");
    await userEvent.click(screen.getByRole("button", { name: "Send magic link" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/didn.t complete/i);
    expect(signUpCreate).not.toHaveBeenCalled();
  });
});
