import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Modal } from "@/modules/ui/Modal/Modal";
import { DestinationList, type DestinationListProps } from "./DestinationList";

const NARROW_SCREEN_QUERY = "(max-width: 767px)";
// The app shell's header exposes this id as its nav slot (sad.md §2, AC-12) — a page places
// its narrow-screen navigation control there rather than in the content body.
const HEADER_NAV_SLOT_ID = "app-header-nav-slot";

function canMatchMedia(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function";
}

function useIsNarrowScreen(): boolean {
  const [isNarrow, setIsNarrow] = useState(() => canMatchMedia() && window.matchMedia(NARROW_SCREEN_QUERY).matches);

  useEffect(() => {
    if (!canMatchMedia()) {
      return;
    }
    const mediaQueryList = window.matchMedia(NARROW_SCREEN_QUERY);
    const handleChange = () => setIsNarrow(mediaQueryList.matches);
    handleChange();
    mediaQueryList.addEventListener("change", handleChange);
    return () => mediaQueryList.removeEventListener("change", handleChange);
  }, []);

  return isNarrow;
}

export type DestinationListDrawerProps = DestinationListProps;

// The narrow-screen overlay wrapping DestinationList (sad.md §5) — on a wide screen the list
// sits inline beside the content; on a narrow screen it lives behind a control and opens
// itself when nothing is selected (AC-07, AC-12).
export function DestinationListDrawer({ destinations, selectedId, onSelect, onAdd }: DestinationListDrawerProps) {
  const isNarrow = useIsNarrowScreen();
  const [isOpen, setIsOpen] = useState(false);
  // Resolved after mount (SSR-safe) so the toggle can portal into the app shell's header nav
  // slot when one is mounted, falling back to rendering inline for isolated component tests.
  const [navSlot, setNavSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setNavSlot(document.getElementById(HEADER_NAV_SLOT_ID));
  }, []);

  useEffect(() => {
    if (isNarrow && !selectedId) {
      setIsOpen(true);
    }
  }, [isNarrow, selectedId]);

  if (!isNarrow) {
    return <DestinationList destinations={destinations} selectedId={selectedId} onSelect={onSelect} onAdd={onAdd} />;
  }

  const toggle = (
    <button type="button" onClick={() => setIsOpen(true)}>
      Your destinations
    </button>
  );

  return (
    <>
      {navSlot ? createPortal(toggle, navSlot) : toggle}
      {isOpen && (
        <Modal title="Your destinations" onClose={() => setIsOpen(false)}>
          <DestinationList
            destinations={destinations}
            selectedId={selectedId}
            onSelect={(id) => {
              onSelect(id);
              setIsOpen(false);
            }}
            onAdd={onAdd}
          />
        </Modal>
      )}
    </>
  );
}
