import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LinkButton } from "./LinkButton";

describe("LinkButton", () => {
  it("renders its label and calls onClick when clicked (default state)", async () => {
    const onClick = vi.fn();
    render(<LinkButton onClick={onClick}>Resend</LinkButton>);

    await userEvent.click(screen.getByRole("button", { name: "Resend" }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("shows a spinner and disables the action in the loading state", async () => {
    const onClick = vi.fn();
    render(
      <LinkButton loading onClick={onClick}>
        Resend
      </LinkButton>,
    );

    const button = screen.getByRole("button", { name: "Resend" });
    expect(button).toBeDisabled();
    expect(screen.getByRole("status")).toBeInTheDocument();

    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
