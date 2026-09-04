import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Spinner } from "./Spinner";

describe("Spinner", () => {
  it("renders as a labeled status indicator", () => {
    render(<Spinner />);
    expect(screen.getByRole("status")).toHaveAccessibleName("Loading");
  });

  it("accepts a custom accessible label", () => {
    render(<Spinner label="Resending" />);
    expect(screen.getByRole("status")).toHaveAccessibleName("Resending");
  });
});
