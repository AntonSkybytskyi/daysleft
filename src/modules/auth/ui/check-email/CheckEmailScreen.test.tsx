import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CheckEmailScreen } from "./CheckEmailScreen";

describe("CheckEmailScreen", () => {
  it("default: confirms the email was sent and offers a resend", async () => {
    const onResend = vi.fn();
    render(<CheckEmailScreen state="default" email="traveler@example.test" onResend={onResend} />);

    expect(screen.getByRole("heading", { name: "Check your email" })).toBeInTheDocument();
    expect(screen.getByText(/traveler@example\.test/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Resend" }));
    expect(onResend).toHaveBeenCalledOnce();
  });

  it("loading: shows the resend action as loading", () => {
    render(<CheckEmailScreen state="loading" email="traveler@example.test" onResend={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Resend" })).toBeDisabled();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("resent-confirmation: shows a success message", () => {
    render(<CheckEmailScreen state="resent-confirmation" email="traveler@example.test" onResend={vi.fn()} />);
    expect(screen.getByText(/link resent/i)).toBeInTheDocument();
  });

  it("error-rate-limited: shows the rate-limit error", () => {
    render(<CheckEmailScreen state="error-rate-limited" email="traveler@example.test" onResend={vi.fn()} />);
    expect(screen.getByRole("alert")).toHaveTextContent(/too many requests/i);
  });
});
