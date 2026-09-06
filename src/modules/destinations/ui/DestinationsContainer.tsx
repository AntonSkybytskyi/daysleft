"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@/modules/ui/Spinner/Spinner";
import {
  addDestinationMutationOptions,
  removeDestinationMutationOptions,
  destinationsQueryOptions,
  DestinationsSessionInvalidError,
  type TrackedDestinationJson,
} from "@/modules/destinations/app/destinations-query";
import { ListUnavailable } from "./ListUnavailable";

export type DestinationsHelpers = {
  addDestination: (destinationRef: string) => Promise<TrackedDestinationJson>;
  removeDestination: (id: string) => Promise<void>;
  retry: () => void;
};

export type DestinationsContainerProps = {
  children: (destinations: TrackedDestinationJson[], helpers: DestinationsHelpers) => React.ReactNode;
};

// Query wiring, error and session routing (T14) — the actual list/picker/detail surfaces
// (T15-T18) render through the children render prop once the read is confirmed.
export function DestinationsContainer({ children }: DestinationsContainerProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoaded } = useUser();
  const userId = user?.id ?? "";

  const enabled = isLoaded && Boolean(user);
  const query = useQuery({ ...destinationsQueryOptions(userId), enabled });

  const sessionInvalidError = query.error instanceof DestinationsSessionInvalidError ? query.error : undefined;

  useEffect(() => {
    if (sessionInvalidError) {
      const path = `${window.location.pathname}${window.location.search}`;
      router.replace(`/login?return_to=${encodeURIComponent(path)}`);
    }
  }, [sessionInvalidError, router]);

  const addMutation = useMutation(addDestinationMutationOptions(queryClient, userId));
  const removeMutation = useMutation(removeDestinationMutationOptions(queryClient, userId));

  const helpers: DestinationsHelpers = {
    addDestination: (destinationRef) => addMutation.mutateAsync({ destination_ref: destinationRef }),
    removeDestination: (id) => removeMutation.mutateAsync(id),
    retry: () => query.refetch(),
  };

  if (!enabled || sessionInvalidError) {
    return <Spinner label="Loading your tracked destinations" />;
  }

  if (query.isSuccess) {
    return <>{children(query.data.items, helpers)}</>;
  }

  if (query.isError || query.errorUpdateCount > 0) {
    return <ListUnavailable onRetry={() => query.refetch()} isRetrying={query.isFetching} />;
  }

  return <Spinner label="Loading your tracked destinations" />;
}
