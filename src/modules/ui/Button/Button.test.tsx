import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("renders its label and calls onClick when clicked (default state)", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Send magic link</Button>);

    await userEvent.click(screen.getByRole("button", { name: "Send magic link" }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders a secondary variant", () => {
    render(<Button variant="secondary">Cancel</Button>);
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("shows a spinner and disables the button in the loading state", async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Send magic link
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Send magic link" });
    expect(button).toBeDisabled();
    expect(screen.getByRole("status")).toBeInTheDocument();

    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("disables the button when disabled is set", () => {
    render(<Button disabled>Send magic link</Button>);
    expect(screen.getByRole("button", { name: "Send magic link" })).toBeDisabled();
  });
});
