import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

import { DashboardContainer } from "./DashboardContainer";

afterEach(() => {
  vi.unstubAllGlobals();
  replace.mockClear();
});

describe("DashboardContainer", () => {
  it("shows loading, then the empty-state dashboard once the fetch resolves", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ status: 200, json: async () => ({ user: { id: "u1", email: "a@b.com" }, has_trips: false }) }),
    );

    render(<DashboardContainer />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/nothing tracked yet/i)).toBeInTheDocument());
  });

  it("redirects to /login when the dashboard fetch returns 401", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 401, json: async () => ({}) }));

    render(<DashboardContainer />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });

  it("calls the logout endpoint and redirects to /login when Log out is clicked", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ status: 200, json: async () => ({ user: { id: "u1", email: "a@b.com" }, has_trips: false }) })
      .mockResolvedValueOnce({ status: 204 });
    vi.stubGlobal("fetch", fetchMock);

    render(<DashboardContainer />);
    await waitFor(() => expect(screen.getByText(/nothing tracked yet/i)).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: "Log out" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/v1/auth/logout", { method: "POST" });
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });
});
