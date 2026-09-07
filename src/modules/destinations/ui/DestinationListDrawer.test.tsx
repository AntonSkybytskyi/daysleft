import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DestinationListDrawer } from "./DestinationListDrawer";
import type { TrackedDestinationJson } from "@/modules/destinations/app/destinations-query";

const destinations: TrackedDestinationJson[] = [
  { id: "d1", destination_ref: "thailand", created_at: "2026-01-01T00:00:00Z" },
];

function mockMatchMedia(matchesNarrow: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: matchesNarrow,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DestinationListDrawer", () => {
  it("renders the list inline (no dialog) at wide widths, with the add action present", () => {
    mockMatchMedia(false);

    render(<DestinationListDrawer destinations={destinations} onSelect={vi.fn()} onAdd={vi.fn()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+ Add" })).toBeInTheDocument();
  });

  it("opens itself on a narrow screen when nothing is selected", () => {
    mockMatchMedia(true);

    render(<DestinationListDrawer destinations={destinations} onSelect={vi.fn()} onAdd={vi.fn()} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+ Add" })).toBeInTheDocument();
  });

  it("AC-01: closes itself once a destination becomes selected (e.g. a confirmed add), not only on an explicit onSelect click", () => {
    mockMatchMedia(true);

    const { rerender } = render(<DestinationListDrawer destinations={destinations} onSelect={vi.fn()} onAdd={vi.fn()} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    rerender(<DestinationListDrawer destinations={destinations} selectedId="d1" onSelect={vi.fn()} onAdd={vi.fn()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("stays closed on a narrow screen when something is selected, until the toggle opens it", async () => {
    mockMatchMedia(true);
    const user = userEvent.setup();

    render(<DestinationListDrawer destinations={destinations} selectedId="d1" onSelect={vi.fn()} onAdd={vi.fn()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Your destinations" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("AC-12: portals its narrow-screen toggle into the header's nav slot when one is mounted", () => {
    mockMatchMedia(true);
    const slot = document.createElement("div");
    slot.id = "app-header-nav-slot";
    document.body.appendChild(slot);

    try {
      render(<DestinationListDrawer destinations={destinations} selectedId="d1" onSelect={vi.fn()} onAdd={vi.fn()} />);

      const toggle = screen.getByRole("button", { name: "Your destinations" });
      expect(slot.contains(toggle)).toBe(true);
    } finally {
      slot.remove();
    }
  });

  it("has 0 serious/critical axe violations when open", async () => {
    mockMatchMedia(true);

    const { container } = render(<DestinationListDrawer destinations={destinations} onSelect={vi.fn()} onAdd={vi.fn()} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
