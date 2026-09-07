import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";
import { DestinationsSessionInvalidError } from "@/modules/destinations/app/destinations-query";
import { DestinationPicker } from "./DestinationPicker";

describe("DestinationPicker", () => {
  it("shows nothing added until a chosen entry's submit confirms", async () => {
    const user = userEvent.setup();
    let resolveAdd: (() => void) | undefined;
    const onAdd = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveAdd = resolve;
        }),
    );

    render(<DestinationPicker onAdd={onAdd} onClose={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Thailand" }));

    expect(onAdd).toHaveBeenCalledWith("thailand");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    resolveAdd?.();
    await waitFor(() => expect(onAdd).toHaveResolved());
  });

  it("shows the inline error without closing on an unsupported/failed submit", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onAdd = vi.fn().mockRejectedValue(new Error("destinations.unsupported_reference"));

    render(<DestinationPicker onAdd={onAdd} onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: "Thailand" }));

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(onClose).not.toHaveBeenCalled();
  });

  it("AC-14: does not show the catalogue-refusal message on a confirmed invalid sign-in — the container routes away instead", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onAdd = vi.fn().mockRejectedValue(new DestinationsSessionInvalidError());

    render(<DestinationPicker onAdd={onAdd} onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: "Thailand" }));

    await waitFor(() => expect(onAdd).toHaveBeenCalled());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("has 0 serious/critical axe violations", async () => {
    const { container } = render(<DestinationPicker onAdd={vi.fn()} onClose={vi.fn()} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
