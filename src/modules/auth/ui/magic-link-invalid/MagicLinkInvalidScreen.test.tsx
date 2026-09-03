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
});
