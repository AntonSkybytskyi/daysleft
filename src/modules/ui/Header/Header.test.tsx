import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Header } from "./Header";

describe("Header", () => {
  it("renders the app title without a logout action when none is given (default state)", () => {
    render(<Header title="daysleft" />);
    expect(screen.getByRole("heading", { name: "daysleft" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Log out" })).not.toBeInTheDocument();
  });

  it("renders a logout action and calls onLogout when clicked", async () => {
    const onLogout = vi.fn();
    render(<Header title="daysleft" onLogout={onLogout} />);

    await userEvent.click(screen.getByRole("button", { name: "Log out" }));

    expect(onLogout).toHaveBeenCalledOnce();
  });
});
