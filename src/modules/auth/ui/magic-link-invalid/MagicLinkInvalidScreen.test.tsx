import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MagicLinkInvalidScreen } from "./MagicLinkInvalidScreen";

describe("MagicLinkInvalidScreen", () => {
  it("default: explains the link is invalid and offers a new one", async () => {
    const onSendNewLink = vi.fn();
    render(<MagicLinkInvalidScreen state="default" onSendNewLink={onSendNewLink} />);

    expect(screen.getByRole("heading", { name: "This link is no longer valid" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Send a new link" }));
    expect(onSendNewLink).toHaveBeenCalledOnce();
  });

  it("loading: shows the send-new-link action as loading", () => {
    render(<MagicLinkInvalidScreen state="loading" onSendNewLink={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Send a new link" })).toBeDisabled();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("error-rate-limited: shows the rate-limit error", () => {
    render(<MagicLinkInvalidScreen state="error-rate-limited" onSendNewLink={vi.fn()} />);
    expect(screen.getByRole("alert")).toHaveTextContent(/too many requests/i);
  });

  it("error-sign-in-failed: shows a visible failure with a way to retry, instead of silently reverting", async () => {
    const onSendNewLink = vi.fn();
    render(<MagicLinkInvalidScreen state="error-sign-in-failed" onSendNewLink={onSendNewLink} />);

    expect(screen.getByRole("alert")).toHaveTextContent(/couldn.t send a new link/i);

    await userEvent.click(screen.getByRole("button", { name: "Send a new link" }));
    expect(onSendNewLink).toHaveBeenCalledOnce();
  });

  it("verified-elsewhere: tells the truth (the link worked, on the other device) and offers no resend", () => {
    render(<MagicLinkInvalidScreen state="verified-elsewhere" onSendNewLink={vi.fn()} />);

    expect(screen.getByRole("status")).toHaveTextContent(/signed in on your other device/i);
    // A resend here would create a NEW sign-in attempt that supersedes the one that just
    // succeeded on the other device — offering it would let the Traveler destroy their own
    // freshly-established session.
    expect(screen.queryByRole("button", { name: "Send a new link" })).not.toBeInTheDocument();
  });

  it("verified-elsewhere-unconfirmed: a first-time sign-up's second device gets a non-destructive way back, not a false success claim or a dead end", async () => {
    const onBackToLogin = vi.fn();
    render(
      <MagicLinkInvalidScreen state="verified-elsewhere-unconfirmed" onSendNewLink={vi.fn()} onBackToLogin={onBackToLogin} />,
    );

    // Unlike verified-elsewhere, this must NOT claim the Traveler is signed in — a first-time
    // sign-up attempt has no poll anywhere, so nothing here can honestly confirm that.
    expect(screen.getByRole("alert")).not.toHaveTextContent(/signed in/i);
    expect(screen.queryByRole("button", { name: "Send a new link" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Back to login" }));
    expect(onBackToLogin).toHaveBeenCalledOnce();
  });
});
