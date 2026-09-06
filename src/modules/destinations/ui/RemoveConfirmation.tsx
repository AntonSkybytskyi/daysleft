import { useState } from "react";
import { Alert } from "@/modules/ui/Alert/Alert";
import { Modal } from "@/modules/ui/Modal/Modal";

export type RemoveConfirmationProps = {
  destinationName: string;
  onConfirm: () => Promise<unknown>;
  onClose: () => void;
};

// The removal confirmation overlay (SCR-06) — the destination stays in the list until the
// removal confirms (AC-08); a failed removal leaves it intact with an unambiguous message
// (AC-17).
export function RemoveConfirmation({ destinationName, onConfirm, onClose }: RemoveConfirmationProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleConfirm = async () => {
    setFailed(false);
    setIsRemoving(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      setFailed(true);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <Modal title="Remove destination" onClose={onClose}>
      {failed && <Alert variant="error">This destination was not removed. Nothing has changed.</Alert>}
      <p>
        Remove <strong>{destinationName}</strong>? This can&apos;t be undone.
      </p>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onClose} disabled={isRemoving}>
          Cancel
        </button>
        <button type="button" onClick={handleConfirm} disabled={isRemoving}>
          Remove
        </button>
      </div>
    </Modal>
  );
}
