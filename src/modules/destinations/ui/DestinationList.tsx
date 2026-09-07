import { destinationDisplayName } from "@/modules/destinations/app/catalogue";
import type { TrackedDestinationJson } from "@/modules/destinations/app/destinations-query";

export type DestinationListProps = {
  destinations: TrackedDestinationJson[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
};

// The list itself, at both widths (sad.md §5) — rows in recorded order (AC-03), the add action
// at the end of the list at every screen width (AC-04).
export function DestinationList({ destinations, selectedId, onSelect, onAdd }: DestinationListProps) {
  return (
    <nav aria-label="Your destinations">
      <ul className="max-h-[70vh] overflow-y-auto">
        {destinations.map((destination) => (
          <li key={destination.id}>
            <button
              type="button"
              aria-current={destination.id === selectedId ? "true" : undefined}
              onClick={() => onSelect(destination.id)}
              className="block w-full px-3 py-2 text-left hover:bg-slate-100 aria-[current=true]:bg-slate-200"
            >
              {destinationDisplayName(destination.destination_ref)}
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={onAdd} className="mt-2 block w-full px-3 py-2 text-left font-medium">
        + Add
      </button>
    </nav>
  );
}
