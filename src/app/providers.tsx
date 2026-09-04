"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  // A client component still renders on the server during SSR. A module-scope client would
  // be shared by every concurrent server render in the process — a cross-Traveler leak risk
  // for this cache's confidential payload (spec §6.1) — so each render gets its own instance.
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
