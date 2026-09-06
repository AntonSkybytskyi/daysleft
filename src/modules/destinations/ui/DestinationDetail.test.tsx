import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DestinationDetail } from "./DestinationDetail";
import type { TrackedDestinationJson } from "@/modules/destinations/app/destinations-query";

describe("DestinationDetail", () => {
  it("states nothing recorded yet for a current catalogue destination", () => {
    const destination: TrackedDestinationJson = {
      id: "d1",
      destination_ref: "thailand",
      created_at: "2026-01-01T00:00:00Z",
    };

    render(<DestinationDetail destination={destination} onRemove={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Thailand" })).toBeInTheDocument();
    expect(screen.getByText("Nothing is recorded for this destination yet.")).toBeInTheDocument();
  });

  it("states nothing recorded yet for a delisted destination reference (AC-09), still under its original name", () => {
    const destination: TrackedDestinationJson = {
      id: "d1",
      destination_ref: "atlantis",
      created_at: "2026-01-01T00:00:00Z",
    };

    render(<DestinationDetail destination={destination} onRemove={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Atlantis" })).toBeInTheDocument();
    expect(screen.getByText("Nothing is recorded for this destination yet.")).toBeInTheDocument();
  });

  it("AC-01: moves keyboard focus onto the detail view when it renders", () => {
    const destination: TrackedDestinationJson = {
      id: "d1",
      destination_ref: "thailand",
      created_at: "2026-01-01T00:00:00Z",
    };

    render(<DestinationDetail destination={destination} onRemove={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Thailand" }).closest('[tabindex="-1"]')).toHaveFocus();
  });

  it("AC-01: moves focus again when the shown destination changes (selecting another from the list)", () => {
    const first: TrackedDestinationJson = { id: "d1", destination_ref: "thailand", created_at: "2026-01-01T00:00:00Z" };
    const second: TrackedDestinationJson = { id: "d2", destination_ref: "vietnam", created_at: "2026-01-02T00:00:00Z" };

    const { rerender } = render(<DestinationDetail destination={first} onRemove={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Thailand" }).closest('[tabindex="-1"]')).toHaveFocus();

    rerender(<DestinationDetail destination={second} onRemove={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Vietnam" }).closest('[tabindex="-1"]')).toHaveFocus();
  });

  it("opens the removal confirmation naming this destination when Remove is chosen", async () => {
    const user = userEvent.setup();
    const destination: TrackedDestinationJson = {
      id: "d1",
      destination_ref: "thailand",
      created_at: "2026-01-01T00:00:00Z",
    };

    render(<DestinationDetail destination={destination} onRemove={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Remove" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent(/Thailand/);
  });
});
