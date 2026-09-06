import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import { DestinationsSessionInvalidError } from "@/modules/destinations/app/destinations-query";
import { RemoveConfirmation } from "./RemoveConfirmation";

describe("RemoveConfirmation", () => {
  it("names the destination being removed and stays open until the removal confirms", async () => {
    const user = userEvent.setup();
    let resolveRemove: (() => void) | undefined;
    const onConfirm = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveRemove = resolve;
        }),
    );
    const onClose = vi.fn();

    render(<RemoveConfirmation destinationName="Thailand" onConfirm={onConfirm} onClose={onClose} />);

    expect(screen.getByText(/Thailand/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(onConfirm).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();

    resolveRemove?.();
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("shows an unambiguous not-removed message on a failed removal, leaving it open", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockRejectedValue(new Error("boom"));
    const onClose = vi.fn();

    render(<RemoveConfirmation destinationName="Thailand" onConfirm={onConfirm} onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/not removed/i));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("AC-14: does not show the not-removed message on a confirmed invalid sign-in — the container routes away instead", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockRejectedValue(new DestinationsSessionInvalidError());
    const onClose = vi.fn();

    render(<RemoveConfirmation destinationName="Thailand" onConfirm={onConfirm} onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalled());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("has 0 serious/critical axe violations", async () => {
    const { container } = render(
      <RemoveConfirmation destinationName="Thailand" onConfirm={vi.fn()} onClose={vi.fn()} />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
