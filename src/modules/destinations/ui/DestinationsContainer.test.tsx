import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

const useUserMock = vi.fn<() => { user: { id: string } | null; isLoaded: boolean }>(() => ({
  user: { id: "u1" },
  isLoaded: true,
}));
vi.mock("@clerk/nextjs", () => ({
  useUser: () => useUserMock(),
}));

import { DestinationsContainer } from "./DestinationsContainer";

function renderContainer(children = vi.fn().mockReturnValue(<div>loaded</div>)) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return {
    client,
    children,
    ...render(
      <QueryClientProvider client={client}>
        <DestinationsContainer>{children}</DestinationsContainer>
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
  useUserMock.mockReset();
  useUserMock.mockReturnValue({ user: { id: "u1" }, isLoaded: true });
});

describe("DestinationsContainer", () => {
  it("renders the loading spinner before the read confirms", async () => {
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));

    renderContainer();

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("routes a confirmed invalid sign-in to sign-in, taking precedence over the recoverable-error presentation", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(mockFetchResponse(401, { error: { code: "auth.session_invalid", message: "x" } })),
    );

    renderContainer();

    await waitFor(() => expect(replace).toHaveBeenCalled());
    expect(replace.mock.calls[0][0]).toMatch(/^\/login\?return_to=/);
    expect(screen.queryByText(/couldn't be read|recoverable/i)).not.toBeInTheDocument();
  });

  it("renders the recoverable error on any other read failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockFetchResponse(500)));

    renderContainer();

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(replace).not.toHaveBeenCalled();
  });

  it("renders children with the confirmed list once the read succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        mockFetchResponse(200, {
          items: [{ id: "d1", destination_ref: "thailand", created_at: "2026-01-01T00:00:00Z" }],
        }),
      ),
    );
    const children = vi.fn().mockReturnValue(<div>rendered</div>);

    renderContainer(children);

    await waitFor(() => expect(screen.getByText("rendered")).toBeInTheDocument());
    expect(children).toHaveBeenCalledWith(
      [{ id: "d1", destination_ref: "thailand", created_at: "2026-01-01T00:00:00Z" }],
      expect.anything(),
    );
  });
});
