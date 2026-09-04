import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Alert } from "./Alert";

describe("Alert", () => {
  it("renders info-variant content with an appropriate role", () => {
    render(<Alert variant="info">We sent a magic link to sign you in.</Alert>);
    expect(screen.getByRole("status")).toHaveTextContent("We sent a magic link to sign you in.");
  });

  it("renders error-variant content with an assertive alert role", () => {
    const message = "Sign-in didn't complete.";
    render(<Alert variant="error">{message}</Alert>);
    expect(screen.getByRole("alert")).toHaveTextContent(message);
  });

  it("renders success-variant content with a status role", () => {
    render(<Alert variant="success">Link resent.</Alert>);
    expect(screen.getByRole("status")).toHaveTextContent("Link resent.");
  });
});
