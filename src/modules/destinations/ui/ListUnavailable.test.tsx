import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ListUnavailable } from "./ListUnavailable";

describe("ListUnavailable", () => {
  it("renders one recoverable-error presentation with a working retry", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(<ListUnavailable onRetry={onRetry} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("disables the retry control while a retry is already in flight", () => {
    render(<ListUnavailable onRetry={vi.fn()} isRetrying />);

    expect(screen.getByRole("button", { name: "Retry" })).toBeDisabled();
  });
});
