import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
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

  it("AC-12: traps Tab within the open dialog, cycling from the last focusable element back to the first", async () => {
    const user = userEvent.setup();
    render(
      <Modal title="Test modal" onClose={vi.fn()}>
        <button>First</button>
        <button>Last</button>
      </Modal>,
    );

    const closeButton = screen.getByRole("button", { name: "Close" });
    const first = screen.getByRole("button", { name: "First" });
    const last = screen.getByRole("button", { name: "Last" });

    last.focus();
    await user.tab();
    expect(document.activeElement).toBe(closeButton);

    first.focus();
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(closeButton);
  });

  it("AC-12: Escape closes only the top-most of two stacked Modal instances, leaving the one beneath open", async () => {
    const user = userEvent.setup();
    const onCloseOuter = vi.fn();
    const onCloseInner = vi.fn();

    function StackedWrapper() {
      const [innerOpen, setInnerOpen] = useState(false);
      return (
        <Modal title="Outer" onClose={onCloseOuter}>
          <button onClick={() => setInnerOpen(true)}>Open inner</button>
          {innerOpen && (
            <Modal title="Inner" onClose={onCloseInner}>
              <button>Inner action</button>
            </Modal>
          )}
        </Modal>
      );
    }

    render(<StackedWrapper />);
    // The outer modal is already open when the inner one (e.g. the add picker over the
    // narrow-screen drawer) opens on top of it — mount order is the stacking order.
    await user.click(screen.getByRole("button", { name: "Open inner" }));

    await user.keyboard("{Escape}");

    expect(onCloseInner).toHaveBeenCalledTimes(1);
    expect(onCloseOuter).not.toHaveBeenCalled();
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
