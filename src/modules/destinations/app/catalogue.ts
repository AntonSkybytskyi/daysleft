export type DestinationCatalogueEntry = {
  ref: string;
  displayName: string;
};

// Frozen in-code constant, not a table (sad.md §5, ADR-0006). Delisting an entry only removes
// it from here, never mutates a destination_ref already written to a row (AC-09).
export const destinationCatalogue: readonly DestinationCatalogueEntry[] = [
  { ref: "schengen", displayName: "Schengen" },
  { ref: "thailand", displayName: "Thailand" },
  { ref: "vietnam", displayName: "Vietnam" },
  { ref: "malaysia", displayName: "Malaysia" },
  { ref: "indonesia", displayName: "Indonesia" },
];

export function isSupportedDestinationRef(ref: string): boolean {
  return destinationCatalogue.some((entry) => entry.ref === ref);
}
