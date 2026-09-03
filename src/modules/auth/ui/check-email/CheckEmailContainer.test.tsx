import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { CheckEmailContainer } from "./CheckEmailContainer";

const signInCreate = vi.fn();

vi.mock("@clerk/nextjs/legacy", () => ({
  useSignIn: () => ({
    isLoaded: true,
    signIn: { create: signInCreate },
  }),
}));

describe("CheckEmailContainer", () => {
  beforeEach(() => {
    signInCreate.mockReset();
  });

  it("resends the magic link and shows the confirmation", async () => {
    signInCreate.mockResolvedValue({});
    render(<CheckEmailContainer email="traveler@example.test" />);

    await userEvent.click(screen.getByRole("button", { name: "Resend" }));

    expect(signInCreate).toHaveBeenCalledWith(
      expect.objectContaining({ identifier: "traveler@example.test", strategy: "email_link" }),
    );
    expect(await screen.findByText(/link resent/i)).toBeInTheDocument();
  });

  it("shows a rate-limit error when the resend fails", async () => {
    signInCreate.mockRejectedValue(new Error("rate limited"));
    render(<CheckEmailContainer email="traveler@example.test" />);

    await userEvent.click(screen.getByRole("button", { name: "Resend" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/too many requests/i);
  });
});
