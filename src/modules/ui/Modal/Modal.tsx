import { useEffect, useId, useRef } from "react";

type ModalProps = {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

// Every currently-mounted Modal instance, outermost first. Escape must act on the top-most
// one only (ADR-0004's accepted stacking-order risk) — one Modal opening over another (the
// add picker over the narrow-screen drawer) must not let a single Escape close both.
const openModalIds: string[] = [];

function focusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
}

// Focus in / focus restore / focus trap / Escape (top-most only) — the shared contract every
// overlay surface in this feature (list drawer, add picker, removal confirmation) relies on
// (AC-12, ADR-0004).
export function Modal({ title, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const id = useId();

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    openModalIds.push(id);

    return () => {
      previouslyFocused.current?.focus();
      const index = openModalIds.indexOf(id);
      if (index !== -1) {
        openModalIds.splice(index, 1);
      }
    };
  }, [id]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (openModalIds[openModalIds.length - 1] === id) {
          onClose();
        }
        return;
      }

      if (event.key !== "Tab" || openModalIds[openModalIds.length - 1] !== id) {
        return;
      }

      const dialog = dialogRef.current;
      if (!dialog) {
        return;
      }
      const focusable = focusableElements(dialog);
      if (focusable.length === 0) {
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [id, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-lg bg-white p-6 shadow-xl outline-none"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
