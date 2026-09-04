import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EmailInput } from "./EmailInput";

describe("EmailInput", () => {
  it("renders a labeled email field and reports changes (default state)", async () => {
    const onChange = vi.fn();
    render(<EmailInput label="Email" value="" onChange={onChange} />);

    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("type", "email");

    await userEvent.type(input, "a");
    expect(onChange).toHaveBeenCalledWith("a");
  });

  it("shows the error state with an associated message", () => {
    render(<EmailInput label="Email" value="not-an-email" onChange={vi.fn()} error="Enter a valid email" />);

    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Enter a valid email")).toBeInTheDocument();
  });
});
