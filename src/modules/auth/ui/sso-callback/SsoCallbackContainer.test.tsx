import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SsoCallbackContainer } from "./SsoCallbackContainer";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@clerk/nextjs", () => ({
  useClerk: () => ({ handleRedirectCallback: vi.fn() }),
}));

afterEach(() => {
  replace.mockClear();
});

describe("SsoCallbackContainer", () => {
  it("shows a spinner while completing the redirect", () => {
    const handleRedirectCallback = vi.fn().mockReturnValue(new Promise(() => {}));
    render(<SsoCallbackContainer returnTo="/dashboard" deps={{ handleRedirectCallback }} />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(handleRedirectCallback).toHaveBeenCalledWith({
      signInFallbackRedirectUrl: "/dashboard",
      signUpFallbackRedirectUrl: "/dashboard",
    });
  });

  it("redirects to /login?error=sign_in_failed when the callback fails for any other reason", async () => {
    const handleRedirectCallback = vi.fn().mockRejectedValue(new Error("oauth failed"));
    render(<SsoCallbackContainer returnTo="/dashboard" deps={{ handleRedirectCallback }} />);

    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith("/login?error=sign_in_failed"));
  });
});
