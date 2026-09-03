import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("renders a heading and body message", () => {
    render(<EmptyState heading="No trips yet" body="Once you add one, it'll show up here." />);

    expect(screen.getByRole("heading", { name: "No trips yet" })).toBeInTheDocument();
    expect(screen.getByText("Once you add one, it'll show up here.")).toBeInTheDocument();
  });
});
