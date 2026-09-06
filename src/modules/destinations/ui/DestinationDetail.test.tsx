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
