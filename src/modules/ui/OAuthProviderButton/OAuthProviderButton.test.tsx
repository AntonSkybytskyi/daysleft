import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OAuthProviderButton } from "./OAuthProviderButton";

describe("OAuthProviderButton", () => {
  it("renders the Google provider label and calls onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<OAuthProviderButton provider="google" onClick={onClick} />);

    await userEvent.click(screen.getByRole("button", { name: "Continue with Google" }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders the GitHub provider label", () => {
    render(<OAuthProviderButton provider="github" onClick={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Continue with GitHub" })).toBeInTheDocument();
  });

  it("shows a spinner and disables the button in the loading state", async () => {
    const onClick = vi.fn();
    render(<OAuthProviderButton provider="google" loading onClick={onClick} />);

    const button = screen.getByRole("button", { name: "Continue with Google" });
    expect(button).toBeDisabled();
    expect(screen.getByRole("status")).toBeInTheDocument();

    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
