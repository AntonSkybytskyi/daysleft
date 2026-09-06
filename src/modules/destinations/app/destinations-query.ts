import type { QueryClient, UseMutationOptions } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import type { ErrorBody } from "@/lib/errors";

export type TrackedDestinationJson = {
  id: string;
  destination_ref: string;
  created_at: string;
};

export type DestinationsData = { items: TrackedDestinationJson[] };

export class DestinationsSessionInvalidError extends Error {
  constructor() {
    super("Destinations session invalid");
    this.name = "DestinationsSessionInvalidError";
  }
}

async function parseErrorBody(response: Response): Promise<ErrorBody | undefined> {
  const parsed = (await response.json()) as { error?: ErrorBody };
  return parsed.error;
}

async function fetchDestinations(): Promise<DestinationsData> {
  const response = await fetch("/api/v1/destinations");

  if (response.status === 401) {
    throw new DestinationsSessionInvalidError();
  }

  if (!response.ok) {
    throw new Error(`Destinations fetch failed with status ${response.status}`);
  }

  return (await response.json()) as DestinationsData;
}

export function destinationsQueryKey(userId: string) {
  return ["destinations", userId] as const;
}

export function destinationsQueryOptions(userId: string) {
  return queryOptions({
    queryKey: destinationsQueryKey(userId),
    queryFn: fetchDestinations,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });
}

export type ResolveSavedAddressResult =
  | { kind: "ok"; destination: TrackedDestinationJson }
  | { kind: "not_found" };

// not-yours/removed/never-existed collapse to one not_found (AC-06) — not a query error, since
// it's an expected, handled outcome the caller falls back on, not a read failure (AC-11).
async function resolveSavedAddress(trackedDestinationId: string): Promise<ResolveSavedAddressResult> {
  const response = await fetch(`/api/v1/destinations/${trackedDestinationId}`);

  if (response.status === 401) {
    throw new DestinationsSessionInvalidError();
  }

  if (response.status === 404) {
    return { kind: "not_found" };
  }

  if (!response.ok) {
    throw new Error(`Resolve saved address failed with status ${response.status}`);
  }

  return { kind: "ok", destination: (await response.json()) as TrackedDestinationJson };
}

export function resolveSavedAddressQueryOptions(trackedDestinationId: string) {
  return queryOptions({
    queryKey: ["destinations", "saved-address", trackedDestinationId] as const,
    queryFn: () => resolveSavedAddress(trackedDestinationId),
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });
}

async function postDestination(destinationRef: string): Promise<TrackedDestinationJson> {
  const response = await fetch("/api/v1/destinations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ destination_ref: destinationRef }),
  });

  if (response.status === 401) {
    throw new DestinationsSessionInvalidError();
  }

  if (!response.ok) {
    const error = await parseErrorBody(response);
    throw new Error(error?.code ?? `Add destination failed with status ${response.status}`);
  }

  return (await response.json()) as TrackedDestinationJson;
}

// The cache is only ever updated in onSuccess, via setQueryData — never optimistically
// (destinations-query.ts DoD, T13; AC-01's "shows nothing added until the mutation confirms").
export function addDestinationMutationOptions(
  queryClient: QueryClient,
  userId: string,
): UseMutationOptions<TrackedDestinationJson, Error, { destination_ref: string }> {
  const key = destinationsQueryKey(userId);
  return {
    mutationFn: (input) => postDestination(input.destination_ref),
    onSuccess: (created) => {
      queryClient.setQueryData<DestinationsData>(key, (current) => ({
        items: [...(current?.items ?? []), created],
      }));
    },
  };
}

async function deleteDestination(id: string): Promise<void> {
  const response = await fetch(`/api/v1/destinations/${id}`, { method: "DELETE" });

  if (response.status === 401) {
    throw new DestinationsSessionInvalidError();
  }

  if (!response.ok && response.status !== 204) {
    throw new Error(`Remove destination failed with status ${response.status}`);
  }
}

export function removeDestinationMutationOptions(
  queryClient: QueryClient,
  userId: string,
): UseMutationOptions<void, Error, string> {
  const key = destinationsQueryKey(userId);
  return {
    mutationFn: (id) => deleteDestination(id),
    onSuccess: (_result, id) => {
      queryClient.setQueryData<DestinationsData>(key, (current) => ({
        items: (current?.items ?? []).filter((item) => item.id !== id),
      }));
    },
  };
}
