import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DestinationList } from "./DestinationList";
import type { TrackedDestinationJson } from "@/modules/destinations/app/destinations-query";

function makeDestination(overrides: Partial<TrackedDestinationJson> = {}): TrackedDestinationJson {
  return { id: "d1", destination_ref: "thailand", created_at: "2026-01-01T00:00:00Z", ...overrides };
}

describe("DestinationList", () => {
  it("renders rows in recorded order", () => {
    const destinations = [
      makeDestination({ id: "d1", destination_ref: "vietnam" }),
      makeDestination({ id: "d2", destination_ref: "thailand" }),
    ];

    render(<DestinationList destinations={destinations} onSelect={vi.fn()} onAdd={vi.fn()} />);

    const nav = screen.getByRole("navigation", { name: "Your destinations" });
    const buttons = within(nav).getAllByRole("button");
    expect(buttons.map((button) => button.textContent)).toEqual(["Vietnam", "Thailand", "+ Add"]);
  });

  it("presents the add action at the end of the list", () => {
    render(<DestinationList destinations={[]} onSelect={vi.fn()} onAdd={vi.fn()} />);

    expect(screen.getByRole("button", { name: "+ Add" })).toBeInTheDocument();
  });

  it("keeps every row keyboard-reachable at 500 tracked destinations", () => {
    const destinations = Array.from({ length: 500 }, (_, i) =>
      makeDestination({ id: `d${i}`, destination_ref: "thailand" }),
    );

    render(<DestinationList destinations={destinations} onSelect={vi.fn()} onAdd={vi.fn()} />);

    const nav = screen.getByRole("navigation", { name: "Your destinations" });
    const buttons = within(nav).getAllByRole("button");
    expect(buttons).toHaveLength(501);
    for (const button of buttons) {
      expect(button).not.toHaveAttribute("tabindex", "-1");
    }
  });
});
