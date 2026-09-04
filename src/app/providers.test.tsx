import { render, screen, waitFor } from "@testing-library/react";
import { useQuery } from "@tanstack/react-query";
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
});
