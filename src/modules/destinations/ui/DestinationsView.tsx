"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  DestinationsSessionInvalidError,
  resolveSavedAddressQueryOptions,
} from "@/modules/destinations/app/destinations-query";
import { Alert } from "@/modules/ui/Alert/Alert";
import { Spinner } from "@/modules/ui/Spinner/Spinner";
import { DestinationsContainer, type DestinationsHelpers } from "./DestinationsContainer";
import { DestinationDetail } from "./DestinationDetail";
import { DestinationListDrawer } from "./DestinationListDrawer";
import { DestinationPicker } from "./DestinationPicker";
import { FirstRunScreen } from "./FirstRunScreen";
import type { TrackedDestinationJson } from "@/modules/destinations/app/destinations-query";

export type DestinationsViewProps = {
  trackedDestinationId?: string;
  addressUnavailable?: boolean;
};

// Composes the list/drawer, the add picker, the detail view and the first-run screen — the
// page-level wiring T19 needs, on top of DestinationsContainer's query/session/error handling.
export function DestinationsView({ trackedDestinationId, addressUnavailable }: DestinationsViewProps) {
  return (
    <DestinationsContainer>
      {(destinations, helpers) => (
        <DestinationsBody
          destinations={destinations}
          helpers={helpers}
          trackedDestinationId={trackedDestinationId}
          addressUnavailable={addressUnavailable}
        />
      )}
    </DestinationsContainer>
  );
}

function DestinationsBody({
  destinations,
  helpers,
  trackedDestinationId,
  addressUnavailable,
}: {
  destinations: TrackedDestinationJson[];
  helpers: DestinationsHelpers;
  trackedDestinationId?: string;
  addressUnavailable?: boolean;
}) {
  const router = useRouter();
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const picker = isPickerOpen && (
    <DestinationPicker
      onAdd={async (ref) => {
        const created = await helpers.addDestination(ref);
        setIsPickerOpen(false);
        router.push(`/dashboard/${created.id}`);
        return created;
      }}
      onClose={() => setIsPickerOpen(false)}
    />
  );

  if (destinations.length === 0) {
    return (
      <>
        <FirstRunScreen onAddClick={() => setIsPickerOpen(true)} />
        {picker}
      </>
    );
  }

  return (
    <div className="flex gap-8">
      <DestinationListDrawer
        destinations={destinations}
        selectedId={trackedDestinationId}
        onSelect={(id) => router.push(`/dashboard/${id}`)}
        onAdd={() => setIsPickerOpen(true)}
      />
      <div className="flex-1">
        {trackedDestinationId ? (
          <SavedAddress trackedDestinationId={trackedDestinationId} helpers={helpers} />
        ) : (
          <>
            {addressUnavailable && <Alert variant="error">That destination isn&apos;t available.</Alert>}
            <p className="py-16 text-center text-slate-600">Choose a destination from your list.</p>
          </>
        )}
      </div>
      {picker}
    </div>
  );
}

function SavedAddress({
  trackedDestinationId,
  helpers,
}: {
  trackedDestinationId: string;
  helpers: DestinationsHelpers;
}) {
  const router = useRouter();
  const query = useQuery(resolveSavedAddressQueryOptions(trackedDestinationId));

  const sessionInvalid = query.error instanceof DestinationsSessionInvalidError;
  const notFound = query.data?.kind === "not_found";

  useEffect(() => {
    if (sessionInvalid) {
      router.replace(`/login?return_to=${encodeURIComponent(`/dashboard/${trackedDestinationId}`)}`);
      return;
    }
    if (notFound) {
      router.replace("/dashboard?unavailable=1");
    }
  }, [sessionInvalid, notFound, router, trackedDestinationId]);

  if (query.isSuccess && query.data.kind === "ok") {
    return (
      <DestinationDetail
        destination={query.data.destination}
        onRemove={async (id) => {
          await helpers.removeDestination(id);
          router.push("/dashboard");
        }}
      />
    );
  }

  return (
    <div className="flex justify-center py-16">
      <Spinner label="Loading this tracked destination" />
    </div>
  );
}
