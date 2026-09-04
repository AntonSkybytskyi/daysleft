import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DashboardScreen } from "./DashboardScreen";

describe("DashboardScreen", () => {
  it("loading: shows the header with logout and a spinner, no empty-state content yet", () => {
    render(<DashboardScreen state="loading" onLogout={vi.fn()} onRetry={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText(/nothing tracked yet/i)).not.toBeInTheDocument();
  });

  it("default/empty: shows the header and the empty-state message (has_trips: false)", async () => {
    const onLogout = vi.fn();
    render(<DashboardScreen state="default" onLogout={onLogout} onRetry={vi.fn()} />);

    expect(screen.getByText(/nothing tracked yet/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Log out" }));
    expect(onLogout).toHaveBeenCalledOnce();
  });

  it("linked-account: tells the Traveler they signed in to their existing account", () => {
    render(<DashboardScreen state="default" onLogout={vi.fn()} onRetry={vi.fn()} linked />);

    expect(screen.getByText(/signed in to your existing account/i)).toBeInTheDocument();
  });

  it("does not show the linked-account message for a fresh account", () => {
    render(<DashboardScreen state="default" onLogout={vi.fn()} onRetry={vi.fn()} />);

    expect(screen.queryByText(/signed in to your existing account/i)).not.toBeInTheDocument();
  });

  it("error: shows a fetch-failure message instead of spinning forever", () => {
    render(<DashboardScreen state="error" onLogout={vi.fn()} onRetry={vi.fn()} />);

    expect(screen.getByRole("alert")).toHaveTextContent(/couldn.t load your dashboard/i);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("error: renders a retry control that calls onRetry when clicked", async () => {
    const onRetry = vi.fn();
    render(<DashboardScreen state="error" onLogout={vi.fn()} onRetry={onRetry} />);

    const retryButton = screen.getByRole("button", { name: "Try again" });
    await userEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("error: shows the retry control's in-flight spinner and disables it while isRetrying", () => {
    render(<DashboardScreen state="error" onLogout={vi.fn()} onRetry={vi.fn()} isRetrying />);

    const retryButton = screen.getByRole("button", { name: "Try again" });
    expect(retryButton).toBeDisabled();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("error-logout-failed: shows a logout-specific message, not the dashboard-fetch-failure one", () => {
    render(<DashboardScreen state="error-logout-failed" onLogout={vi.fn()} onRetry={vi.fn()} />);

    expect(screen.getByRole("alert")).toHaveTextContent(/couldn.t sign you out/i);
  });

  it("renders translated strings when supplied (proves the text is not hardcoded)", () => {
    render(
      <DashboardScreen
        state="default"
        onLogout={vi.fn()}
        onRetry={vi.fn()}
        strings={{ emptyHeading: "Rien à suivre.", logout: "Se déconnecter" }}
      />,
    );

    expect(screen.getByText("Rien à suivre.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Se déconnecter" })).toBeInTheDocument();
  });
});
