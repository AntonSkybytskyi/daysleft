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

// A delisted reference still resolves under its original name (AC-09) — this never relabels
// it, it just has no catalogue entry to read a display name from, so it falls back to the ref.
export function destinationDisplayName(ref: string): string {
  const entry = destinationCatalogue.find((candidate) => candidate.ref === ref);
  if (entry) {
    return entry.displayName;
  }
  return ref.length > 0 ? ref.charAt(0).toUpperCase() + ref.slice(1) : ref;
}
