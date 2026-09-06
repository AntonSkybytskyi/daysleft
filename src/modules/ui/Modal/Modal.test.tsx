import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "./Modal";

function Wrapper() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(true)}>Invoking control</button>
      {open && (
        <Modal title="Test modal" onClose={() => setOpen(false)}>
          <button>Inside action</button>
        </Modal>
      )}
    </div>
  );
}

describe("Modal", () => {
  it("moves focus into the modal on open", () => {
    render(
      <Modal title="Test modal" onClose={vi.fn()}>
        <button>Inside action</button>
      </Modal>,
    );

    expect(screen.getByRole("dialog")).toContainElement(document.activeElement as HTMLElement);
  });

  it("returns focus to the invoking control on close", async () => {
    const user = userEvent.setup();
    render(<Wrapper />);
    const invoker = screen.getByRole("button", { name: "Invoking control" });

    await user.click(invoker);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(document.activeElement).toBe(invoker);
  });

  it("closes on Escape", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Modal title="Test modal" onClose={onClose}>
        <button>Inside action</button>
      </Modal>,
    );

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("has 0 serious/critical axe violations in isolation", async () => {
    const { container } = render(
      <Modal title="Test modal" onClose={vi.fn()}>
        <button>Inside action</button>
      </Modal>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
