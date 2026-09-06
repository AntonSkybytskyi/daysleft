import { describe, expect, it } from "vitest";
import { destinationCatalogue, destinationDisplayName, isSupportedDestinationRef } from "./catalogue";

describe("destinationCatalogue", () => {
  it("exposes exactly the five named entries", () => {
    expect(destinationCatalogue.map((entry) => entry.ref).sort()).toEqual(
      ["indonesia", "malaysia", "schengen", "thailand", "vietnam"].sort(),
    );
    expect(destinationCatalogue).toHaveLength(5);
  });

  it("each entry has a display name and a permanent reference", () => {
    for (const entry of destinationCatalogue) {
      expect(typeof entry.ref).toBe("string");
      expect(typeof entry.displayName).toBe("string");
      expect(entry.displayName.length).toBeGreaterThan(0);
    }
  });
});

describe("isSupportedDestinationRef", () => {
  it("returns true for each of the five catalogue refs", () => {
    for (const entry of destinationCatalogue) {
      expect(isSupportedDestinationRef(entry.ref)).toBe(true);
    }
  });

  it("returns false for any reference not in the catalogue", () => {
    expect(isSupportedDestinationRef("atlantis")).toBe(false);
    expect(isSupportedDestinationRef("")).toBe(false);
  });
});

describe("destinationDisplayName", () => {
  it("returns the catalogue's display name for a current reference", () => {
    expect(destinationDisplayName("thailand")).toBe("Thailand");
  });

  it("falls back to a capitalized ref for a delisted reference (AC-09) — never relabels it", () => {
    expect(destinationDisplayName("atlantis")).toBe("Atlantis");
  });
});
