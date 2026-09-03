import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LoginScreen } from "./LoginScreen";

function baseProps() {
  return {
    email: "",
    onEmailChange: vi.fn(),
    onGoogleClick: vi.fn(),
    onGithubClick: vi.fn(),
    onSendMagicLink: vi.fn(),
  };
}

describe("LoginScreen", () => {
  it("default: offers Google, GitHub and magic-link email sign-in", async () => {
    const props = baseProps();
    render(<LoginScreen state="default" {...props} />);

    expect(screen.getByRole("button", { name: "Continue with Google" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Continue with GitHub" })).toBeEnabled();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Continue with Google" }));
    expect(props.onGoogleClick).toHaveBeenCalledOnce();
  });

  it("loading: shows the chosen provider as loading and disables it", () => {
    const props = baseProps();
    render(<LoginScreen state="loading" loadingProvider="google" {...props} />);

    expect(screen.getByRole("button", { name: "Continue with Google" })).toBeDisabled();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("error-sign-in-failed: shows the failure alert and lets the Traveler retry any method", () => {
    const props = baseProps();
    render(<LoginScreen state="error-sign-in-failed" {...props} />);

    expect(screen.getByRole("alert")).toHaveTextContent(/didn.t complete/i);
    expect(screen.getByRole("button", { name: "Continue with Google" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Continue with GitHub" })).toBeEnabled();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("error-email-required: shows the email-required alert without the email field", () => {
    const props = baseProps();
    render(<LoginScreen state="error-email-required" {...props} />);

    expect(screen.getByRole("alert")).toHaveTextContent(/verified email/i);
    expect(screen.getByRole("button", { name: "Continue with Google" })).toBeEnabled();
    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
  });

  it("redirected-sign-in-required: shows an info alert prompting sign-in", () => {
    const props = baseProps();
    render(<LoginScreen state="redirected-sign-in-required" {...props} />);

    expect(screen.getByRole("status")).toHaveTextContent(/sign in to continue/i);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });
});
