import { useEffect, useState } from "react";
import { Modal } from "@/modules/ui/Modal/Modal";
import { DestinationList, type DestinationListProps } from "./DestinationList";

const NARROW_SCREEN_QUERY = "(max-width: 767px)";

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

  useEffect(() => {
    if (isNarrow && !selectedId) {
      setIsOpen(true);
    }
  }, [isNarrow, selectedId]);

  if (!isNarrow) {
    return <DestinationList destinations={destinations} selectedId={selectedId} onSelect={onSelect} onAdd={onAdd} />;
  }

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)}>
        Your destinations
      </button>
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
