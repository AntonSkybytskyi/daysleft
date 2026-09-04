import { render, screen, waitFor } from "@testing-library/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { describe, expect, it } from "vitest";

import { Providers } from "./providers";

function QueryConsumer() {
  const { data, status } = useQuery({
    queryKey: ["providers-smoke-test"],
    queryFn: async () => "ok",
  });

  if (status === "pending") return <p>loading</p>;
  if (status === "error") return <p role="alert">query failed</p>;
  return <p>{data}</p>;
}

describe("Providers", () => {
  it("supplies a QueryClient so a descendant's useQuery can resolve", async () => {
    render(
      <Providers>
        <QueryConsumer />
      </Providers>,
    );

    await waitFor(() => expect(screen.getByText("ok")).toBeInTheDocument());
  });

  it("gives each Providers instance its own QueryClient, not one shared across renders", () => {
    function ClientIdentity({ onClient }: { onClient: (client: unknown) => void }) {
      const client = useQueryClient();
      useEffect(() => {
        onClient(client);
      }, [client, onClient]);
      return null;
    }

    let clientA: unknown;
    let clientB: unknown;

    render(
      <Providers>
        <ClientIdentity onClient={(c) => (clientA = c)} />
      </Providers>,
    );
    render(
      <Providers>
        <ClientIdentity onClient={(c) => (clientB = c)} />
      </Providers>,
    );

    expect(clientA).not.toBe(clientB);
  });
});
