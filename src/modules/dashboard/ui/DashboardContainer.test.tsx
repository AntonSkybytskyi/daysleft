import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
  useUser: () => ({ user: { id: "u1" }, isLoaded: true }),
}));

vi.mock("@/modules/dashboard/app/dashboard-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/dashboard/app/dashboard-query")>();
  return {
    ...actual,
    dashboardQueryOptions: vi.fn(actual.dashboardQueryOptions),
  };
});

import * as dashboardQueryModule from "@/modules/dashboard/app/dashboard-query";
import { DashboardContainer } from "./DashboardContainer";

function renderDashboard(client: QueryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  return {
    client,
    ...render(
      <QueryClientProvider client={client}>
        <DashboardContainer />
      </QueryClientProvider>,
    ),
  };
}

function mockFetchResponse(status: number, body?: unknown) {
  return { status, ok: status >= 200 && status < 300, json: async () => body };
}

afterEach(() => {
  vi.unstubAllGlobals();
  replace.mockClear();
  signOut.mockClear();
  vi.mocked(dashboardQueryModule.dashboardQueryOptions).mockClear();
});

describe("DashboardContainer", () => {
  it("shows loading, then the empty-state dashboard once the fetch resolves", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(mockFetchResponse(200, { user: { id: "u1", email: "a@b.com" }, has_trips: false })),
    );

    renderDashboard();

    expect(screen.getByRole("status")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/nothing tracked yet/i)).toBeInTheDocument());
  });

  it("shows the linked-account banner when the dashboard response reports linked:true", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        mockFetchResponse(200, { user: { id: "u1", email: "a@b.com" }, has_trips: false, linked: true }),
      ),
    );

    renderDashboard();

    await waitFor(() => expect(screen.getByText(/signed in to your existing account/i)).toBeInTheDocument());
  });

  it("redirects to /login, forwarding the server's return_to, when the dashboard fetch returns 401", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        mockFetchResponse(401, {
          error: { code: "auth.session_invalid", details: { return_to: "/dashboard/trips/123" } },
        }),
      ),
    );

    renderDashboard();

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(`/login?return_to=${encodeURIComponent("/dashboard/trips/123")}`),
    );
  });

  it("shows an error instead of spinning forever when the dashboard fetch rejects", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    renderDashboard();

    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn.t load your dashboard/i);
  });

  it("redirects to /login?error=email_required when the dashboard fetch returns 401 auth.email_required", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(mockFetchResponse(401, { error: { code: "auth.email_required" } })),
    );

    renderDashboard();

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login?error=email_required"));
  });

  it("redirects to /login?error=email_conflict when the dashboard fetch returns 401 auth.email_conflict", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(mockFetchResponse(401, { error: { code: "auth.email_conflict" } })),
    );

    renderDashboard();

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login?error=email_conflict"));
  });

  it("calls the logout endpoint and redirects to /login when Log out is clicked", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockFetchResponse(200, { user: { id: "u1", email: "a@b.com" }, has_trips: false }))
      .mockResolvedValueOnce(mockFetchResponse(204));
    vi.stubGlobal("fetch", fetchMock);

    renderDashboard();
    await waitFor(() => expect(screen.getByText(/nothing tracked yet/i)).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: "Log out" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/v1/auth/logout", { method: "POST" });
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(signOut).toHaveBeenCalled();
  });

  it("clears the client-side Clerk session on logout, not only the server-side one", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockFetchResponse(200, { user: { id: "u1", email: "a@b.com" }, has_trips: false }))
      .mockResolvedValueOnce(mockFetchResponse(204));
    vi.stubGlobal("fetch", fetchMock);

    renderDashboard();
    await waitFor(() => expect(screen.getByText(/nothing tracked yet/i)).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: "Log out" }));

    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));
  });

  it("does not clear the client-side Clerk session when the server didn't actually revoke it", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockFetchResponse(200, { user: { id: "u1", email: "a@b.com" }, has_trips: false }))
      .mockResolvedValueOnce(mockFetchResponse(500));
    vi.stubGlobal("fetch", fetchMock);

    renderDashboard();
    await waitFor(() => expect(screen.getByText(/nothing tracked yet/i)).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: "Log out" }));

    await screen.findByRole("alert");
    expect(signOut).not.toHaveBeenCalled();
  });

  it("shows a logout-specific error (not the dashboard-fetch one) instead of redirecting when the logout request fails server-side", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockFetchResponse(200, { user: { id: "u1", email: "a@b.com" }, has_trips: false }))
      .mockResolvedValueOnce(mockFetchResponse(500));
    vi.stubGlobal("fetch", fetchMock);

    renderDashboard();
    await waitFor(() => expect(screen.getByText(/nothing tracked yet/i)).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: "Log out" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn.t sign you out/i);
    expect(replace).not.toHaveBeenCalledWith("/login");
  });

  it("redirects to /login even when clerk.signOut() rejects, since the server already revoked the session (204)", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockFetchResponse(200, { user: { id: "u1", email: "a@b.com" }, has_trips: false }))
      .mockResolvedValueOnce(mockFetchResponse(204));
    vi.stubGlobal("fetch", fetchMock);
    signOut.mockRejectedValueOnce(new Error("network blip"));

    renderDashboard();
    await waitFor(() => expect(screen.getByText(/nothing tracked yet/i)).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: "Log out" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    // The server-confirmed revoke is authoritative — retrying would only re-POST a
    // logout that now 401s (no server session left), trapping the user forever.
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries clerk.signOut() itself (not the server logout call) when it rejects, so no live client session survives a transient blip", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockFetchResponse(200, { user: { id: "u1", email: "a@b.com" }, has_trips: false }))
      .mockResolvedValueOnce(mockFetchResponse(204));
    vi.stubGlobal("fetch", fetchMock);
    signOut.mockRejectedValueOnce(new Error("network blip")).mockResolvedValueOnce(undefined);

    renderDashboard();
    await waitFor(() => expect(screen.getByText(/nothing tracked yet/i)).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: "Log out" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(signOut).toHaveBeenCalledTimes(2);
    // The server logout endpoint is never re-POSTed — only the client-side signOut retries.
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("gives up retrying clerk.signOut() after exactly 3 attempts and surfaces a failure instead of claiming a possibly-live session is gone", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockFetchResponse(200, { user: { id: "u1", email: "a@b.com" }, has_trips: false }))
      .mockResolvedValueOnce(mockFetchResponse(204));
    vi.stubGlobal("fetch", fetchMock);
    signOut.mockRejectedValue(new Error("network down"));

    renderDashboard();
    await waitFor(() => expect(screen.getByText(/nothing tracked yet/i)).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: "Log out" }));

    // The server already revoked the session (204), but if the client-side signOut() keeps
    // failing, the client may still hold a live session — redirecting to /login here would
    // falsely tell the Traveler they're signed out. A real bound (not a loose > 1), and a
    // failure state instead of an optimistic redirect.
    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn.t sign you out/i);
    expect(signOut).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(replace).not.toHaveBeenCalledWith("/login");
  });

  it("waits between clerk.signOut() retry attempts instead of firing them back-to-back", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockFetchResponse(200, { user: { id: "u1", email: "a@b.com" }, has_trips: false }))
      .mockResolvedValueOnce(mockFetchResponse(204));
    vi.stubGlobal("fetch", fetchMock);
    signOut.mockRejectedValueOnce(new Error("blip 1")).mockResolvedValueOnce(undefined);
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");

    renderDashboard();
    await waitFor(() => expect(screen.getByText(/nothing tracked yet/i)).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: "Log out" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(setTimeoutSpy).toHaveBeenCalled();
    setTimeoutSpy.mockRestore();
  });

  it("shows a logout-specific error (not the dashboard-fetch one) instead of redirecting when the logout request rejects (network failure)", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockFetchResponse(200, { user: { id: "u1", email: "a@b.com" }, has_trips: false }))
      .mockRejectedValueOnce(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);

    renderDashboard();
    await waitFor(() => expect(screen.getByText(/nothing tracked yet/i)).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: "Log out" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn.t sign you out/i);
    expect(replace).not.toHaveBeenCalledWith("/login");
  });
});

describe("DashboardContainer — TanStack Query migration (T3)", () => {
  it("AC-01: a cache-hit revisit renders the summary immediately with no loading state and no second fetch", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(mockFetchResponse(200, { user: { id: "u1", email: "a@b.com" }, has_trips: false }));
    vi.stubGlobal("fetch", fetchMock);

    const { client, unmount } = renderDashboard();
    await waitFor(() => expect(screen.getByText(/nothing tracked yet/i)).toBeInTheDocument());
    unmount();

    renderDashboard(client);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByText(/nothing tracked yet/i)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(dashboardQueryModule.dashboardQueryOptions).toHaveBeenCalledWith("u1");
  });

  it("AC-06: shows the loading indicator on first load until the fetch resolves", async () => {
    let resolveFetch!: (value: unknown) => void;
    const pendingFetch = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(pendingFetch));

    renderDashboard();

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText(/nothing tracked yet/i)).not.toBeInTheDocument();

    resolveFetch(mockFetchResponse(200, { user: { id: "u1", email: "a@b.com" }, has_trips: false }));

    await waitFor(() => expect(screen.getByText(/nothing tracked yet/i)).toBeInTheDocument());
    expect(dashboardQueryModule.dashboardQueryOptions).toHaveBeenCalledWith("u1");
  });

  it("AC-03: a confirmed invalid-session fetch redirects to sign-in and shows no dashboard data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        mockFetchResponse(401, {
          error: { code: "auth.session_invalid", details: { return_to: "/dashboard" } },
        }),
      ),
    );

    renderDashboard();

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(`/login?return_to=${encodeURIComponent("/dashboard")}`),
    );
    expect(screen.queryByText(/nothing tracked yet/i)).not.toBeInTheDocument();
    expect(dashboardQueryModule.dashboardQueryOptions).toHaveBeenCalledWith("u1");
  });

  it("AC-03 vs AC-02: a plain connectivity/server failure does NOT redirect and reaches the error state instead", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    renderDashboard();

    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn.t load your dashboard/i);
    expect(replace).not.toHaveBeenCalled();
    expect(dashboardQueryModule.dashboardQueryOptions).toHaveBeenCalledWith("u1");
  });

  it("AC-02: a non-session fetch failure shows exactly one retry Button, and fires no automatic retry", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);

    renderDashboard();

    await screen.findByRole("alert");
    const retryButtons = screen.getAllByRole("button", { name: /try again/i });
    expect(retryButtons).toHaveLength(1);

    // No automatic retry: the failure was the query's only fetch, and the count stays
    // put with nothing further pending (retry:false at the query layer, per AC-02).
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });

  it("AC-02: clicking the retry Button re-issues exactly one fetch and shows the Button's own loading state while it's in flight", async () => {
    let resolveRetry!: (value: unknown) => void;
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("network down"))
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveRetry = resolve;
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    renderDashboard();

    await screen.findByRole("alert");
    const retryButton = screen.getByRole("button", { name: /try again/i });

    await userEvent.click(retryButton);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    // In-flight retry: no screen-level state change — the same error Alert/Button are
    // still rendered, only the Button itself reflects the pending request.
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeDisabled();

    resolveRetry(mockFetchResponse(200, { user: { id: "u1", email: "a@b.com" }, has_trips: false }));

    await waitFor(() => expect(screen.getByText(/nothing tracked yet/i)).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
