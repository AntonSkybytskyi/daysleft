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

  it("linked-account: tells the Traveler they signed in to their existing account", () => {
    render(<DashboardScreen state="default" onLogout={vi.fn()} linked />);

    expect(screen.getByText(/signed in to your existing account/i)).toBeInTheDocument();
  });

  it("does not show the linked-account message for a fresh account", () => {
    render(<DashboardScreen state="default" onLogout={vi.fn()} />);

    expect(screen.queryByText(/signed in to your existing account/i)).not.toBeInTheDocument();
  });

  it("renders translated strings when supplied (proves the text is not hardcoded)", () => {
    render(
      <DashboardScreen
        state="default"
        onLogout={vi.fn()}
        strings={{ emptyHeading: "Rien à suivre.", logout: "Se déconnecter" }}
      />,
    );

    expect(screen.getByText("Rien à suivre.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Se déconnecter" })).toBeInTheDocument();
  });
});
