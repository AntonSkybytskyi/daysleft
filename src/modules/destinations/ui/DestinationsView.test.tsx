import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push }),
}));

const useUserMock = vi.fn(() => ({ user: { id: "u1" }, isLoaded: true }));
vi.mock("@clerk/nextjs", () => ({
  useUser: () => useUserMock(),
}));

import { DestinationsView } from "./DestinationsView";

function mockFetchResponse(status: number, body?: unknown) {
  return { status, ok: status >= 200 && status < 300, json: async () => body };
}

function renderView(trackedDestinationId?: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <DestinationsView trackedDestinationId={trackedDestinationId} />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  replace.mockClear();
  push.mockClear();
});

describe("DestinationsView", () => {
  it("renders the first-run screen for a confirmed-empty list", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockFetchResponse(200, { items: [] })));

    renderView();

    await waitFor(() => expect(screen.getByText("Nothing tracked yet")).toBeInTheDocument());
  });

  it("renders the list with nothing selected when there is no trackedDestinationId", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        mockFetchResponse(200, {
          items: [{ id: "d1", destination_ref: "thailand", created_at: "2026-01-01T00:00:00Z" }],
        }),
      ),
    );

    renderView();

    await waitFor(() => expect(screen.getByText(/choose a destination/i)).toBeInTheDocument());
  });

  it("opens the picker and navigates to the new detail address on a confirmed add", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === "POST") {
        return Promise.resolve(
          mockFetchResponse(201, { id: "new-id", destination_ref: "thailand", created_at: "2026-01-01T00:00:00Z" }),
        );
      }
      return Promise.resolve(mockFetchResponse(200, { items: [] }));
    });
    vi.stubGlobal("fetch", fetchMock);

    renderView();
    await waitFor(() => expect(screen.getByRole("button", { name: /add/i })).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /add/i }));
    await user.click(screen.getByRole("button", { name: "Thailand" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard/new-id"));
  });

  it("resolves a saved address and renders its detail view", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        if (url === "/api/v1/destinations/d1") {
          return Promise.resolve(
            mockFetchResponse(200, { id: "d1", destination_ref: "thailand", created_at: "2026-01-01T00:00:00Z" }),
          );
        }
        return Promise.resolve(
          mockFetchResponse(200, {
            items: [{ id: "d1", destination_ref: "thailand", created_at: "2026-01-01T00:00:00Z" }],
          }),
        );
      }),
    );

    renderView("d1");

    await waitFor(() => expect(screen.getByRole("heading", { name: "Thailand" })).toBeInTheDocument());
  });

  it("falls back to the plain home address on a not-yours/removed/never-existed saved address (AC-06)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        if (url === "/api/v1/destinations/missing") {
          return Promise.resolve(mockFetchResponse(404, { error: { code: "destinations.not_found", message: "x" } }));
        }
        return Promise.resolve(
          mockFetchResponse(200, {
            items: [{ id: "d1", destination_ref: "thailand", created_at: "2026-01-01T00:00:00Z" }],
          }),
        );
      }),
    );

    renderView("missing");

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard?unavailable=1"));
  });

  it("AC-11: shows ListUnavailable with a working retry instead of hanging when a saved-address read fails for a reason other than session-invalid or not-found", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === "/api/v1/destinations/d1") {
        return Promise.resolve(mockFetchResponse(500));
      }
      return Promise.resolve(
        mockFetchResponse(200, {
          items: [{ id: "d1", destination_ref: "thailand", created_at: "2026-01-01T00:00:00Z" }],
        }),
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    renderView("d1");

    await waitFor(() => expect(screen.getByText(/couldn't be read|can't be read|unavailable/i)).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /retry|try again/i })).toBeInTheDocument();
  });

  it("shows the not-available message on the plain home address after a rejected saved address (AC-06)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        mockFetchResponse(200, {
          items: [{ id: "d1", destination_ref: "thailand", created_at: "2026-01-01T00:00:00Z" }],
        }),
      ),
    );

    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <DestinationsView addressUnavailable />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByText("That destination isn't available.")).toBeInTheDocument());
    expect(screen.getByText(/choose a destination/i)).toBeInTheDocument();
  });
});
