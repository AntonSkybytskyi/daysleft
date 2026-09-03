import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

const signOut = vi.fn().mockResolvedValue(undefined);
vi.mock("@clerk/nextjs", () => ({
  useClerk: () => ({ signOut }),
}));

import { DashboardContainer } from "./DashboardContainer";

afterEach(() => {
  vi.unstubAllGlobals();
  replace.mockClear();
  signOut.mockClear();
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

  it("redirects to /login, forwarding the server's return_to, when the dashboard fetch returns 401", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 401,
        json: async () => ({
          error: { code: "auth.session_invalid", details: { return_to: "/dashboard/trips/123" } },
        }),
      }),
    );

    render(<DashboardContainer />);

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(`/login?return_to=${encodeURIComponent("/dashboard/trips/123")}`),
    );
  });

  it("shows an error instead of spinning forever when the dashboard fetch rejects", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    render(<DashboardContainer />);

    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn.t load your dashboard/i);
  });

  it("redirects to /login?error=email_required when the dashboard fetch returns 401 auth.email_required", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ status: 401, json: async () => ({ error: { code: "auth.email_required" } }) }),
    );

    render(<DashboardContainer />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login?error=email_required"));
  });

  it("redirects to /login?error=email_conflict when the dashboard fetch returns 401 auth.email_conflict", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ status: 401, json: async () => ({ error: { code: "auth.email_conflict" } }) }),
    );

    render(<DashboardContainer />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login?error=email_conflict"));
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
    expect(signOut).toHaveBeenCalled();
  });

  it("clears the client-side Clerk session on logout, not only the server-side one", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ status: 200, json: async () => ({ user: { id: "u1", email: "a@b.com" }, has_trips: false }) })
      .mockResolvedValueOnce({ status: 204 });
    vi.stubGlobal("fetch", fetchMock);

    render(<DashboardContainer />);
    await waitFor(() => expect(screen.getByText(/nothing tracked yet/i)).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: "Log out" }));

    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));
  });

  it("does not clear the client-side Clerk session when the server didn't actually revoke it", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ status: 200, json: async () => ({ user: { id: "u1", email: "a@b.com" }, has_trips: false }) })
      .mockResolvedValueOnce({ status: 500 });
    vi.stubGlobal("fetch", fetchMock);

    render(<DashboardContainer />);
    await waitFor(() => expect(screen.getByText(/nothing tracked yet/i)).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: "Log out" }));

    await screen.findByRole("alert");
    expect(signOut).not.toHaveBeenCalled();
  });

  it("shows an error instead of redirecting when the logout request fails server-side (no client-side-only logout)", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ status: 200, json: async () => ({ user: { id: "u1", email: "a@b.com" }, has_trips: false }) })
      .mockResolvedValueOnce({ status: 500 });
    vi.stubGlobal("fetch", fetchMock);

    render(<DashboardContainer />);
    await waitFor(() => expect(screen.getByText(/nothing tracked yet/i)).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: "Log out" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn.t load your dashboard/i);
    expect(replace).not.toHaveBeenCalledWith("/login");
  });

  it("shows an error instead of redirecting when the logout request rejects (network failure)", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ status: 200, json: async () => ({ user: { id: "u1", email: "a@b.com" }, has_trips: false }) })
      .mockRejectedValueOnce(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);

    render(<DashboardContainer />);
    await waitFor(() => expect(screen.getByText(/nothing tracked yet/i)).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: "Log out" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn.t load your dashboard/i);
    expect(replace).not.toHaveBeenCalledWith("/login");
  });
});
