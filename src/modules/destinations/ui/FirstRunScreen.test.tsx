import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FirstRunScreen } from "./FirstRunScreen";

describe("FirstRunScreen", () => {
  it("renders a screen of its own whose single action adds a first destination", async () => {
    const user = userEvent.setup();
    const onAddClick = vi.fn();

    render(<FirstRunScreen onAddClick={onAddClick} />);

    expect(screen.getByRole("heading")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /add/i }));

    expect(onAddClick).toHaveBeenCalledTimes(1);
  });
});
