import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DashboardScreen } from "./DashboardScreen";

describe("DashboardScreen", () => {
  it("loading: shows the header with logout and a spinner, no empty-state content yet", () => {
    render(<DashboardScreen state="loading" onLogout={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText(/nothing tracked yet/i)).not.toBeInTheDocument();
  });

  it("default/empty: shows the header and the empty-state message (has_trips: false)", async () => {
    const onLogout = vi.fn();
    render(<DashboardScreen state="default" onLogout={onLogout} />);

    expect(screen.getByText(/nothing tracked yet/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Log out" }));
    expect(onLogout).toHaveBeenCalledOnce();
  });
});
