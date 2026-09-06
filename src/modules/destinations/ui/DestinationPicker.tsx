import { useState } from "react";
import { destinationCatalogue } from "@/modules/destinations/app/catalogue";
import { Alert } from "@/modules/ui/Alert/Alert";
import { Modal } from "@/modules/ui/Modal/Modal";
import { Spinner } from "@/modules/ui/Spinner/Spinner";

export type DestinationPickerProps = {
  onAdd: (destinationRef: string) => Promise<unknown>;
  onClose: () => void;
};

// The add picker overlay (SCR-02) — nothing is added until the mutation confirms (AC-01), and
// an unsupported/failed submit shows the inline error without closing (AC-02).
export function DestinationPicker({ onAdd, onClose }: DestinationPickerProps) {
  const [submittingRef, setSubmittingRef] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChoose = async (ref: string) => {
    setError(null);
    setSubmittingRef(ref);
    try {
      await onAdd(ref);
    } catch {
      setError("Only the destinations the app supports can be tracked.");
    } finally {
      setSubmittingRef(null);
    }
  };

  return (
    <Modal title="Add a destination" onClose={onClose}>
      {error && <Alert variant="error">{error}</Alert>}
      <ul>
        {destinationCatalogue.map((entry) => (
          <li key={entry.ref}>
            <button
              type="button"
              onClick={() => handleChoose(entry.ref)}
              disabled={submittingRef !== null}
              className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-slate-100"
            >
              {entry.displayName}
              {submittingRef === entry.ref && <Spinner label={`Adding ${entry.displayName}`} />}
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
