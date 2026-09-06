import { useState } from "react";
import { destinationDisplayName } from "@/modules/destinations/app/catalogue";
import type { TrackedDestinationJson } from "@/modules/destinations/app/destinations-query";
import { Button } from "@/modules/ui/Button/Button";
import { EmptyState } from "@/modules/ui/EmptyState/EmptyState";
import { RemoveConfirmation } from "./RemoveConfirmation";

export type DestinationDetailProps = {
  destination: TrackedDestinationJson;
  onRemove: (id: string) => Promise<unknown>;
};

// One tracked destination, at its own address (SCR-04) — nothing recorded yet, whether the
// destination is still in the catalogue or delisted (AC-09).
export function DestinationDetail({ destination, onRemove }: DestinationDetailProps) {
  const [confirming, setConfirming] = useState(false);
  const name = destinationDisplayName(destination.destination_ref);

  return (
    <div>
      <EmptyState heading={name} body="Nothing is recorded for this destination yet." />
      <div className="flex justify-center">
        <Button variant="secondary" onClick={() => setConfirming(true)}>
          Remove
        </Button>
      </div>
      {confirming && (
        <RemoveConfirmation
          destinationName={name}
          onConfirm={() => onRemove(destination.id)}
          onClose={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
