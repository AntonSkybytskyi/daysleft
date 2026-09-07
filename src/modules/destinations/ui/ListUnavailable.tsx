import { Alert } from "@/modules/ui/Alert/Alert";
import { Button } from "@/modules/ui/Button/Button";

export type ListUnavailableProps = {
  onRetry: () => void;
  isRetrying?: boolean;
};

// The one recoverable-error presentation for any non-auth read failure (AC-11) — same
// presentation whatever the underlying cause, with a retry the Traveler may use as often as
// they like.
export function ListUnavailable({ onRetry, isRetrying = false }: ListUnavailableProps) {
  return (
    <Alert variant="error">
      <p>Your tracked destinations couldn&apos;t be read.</p>
      <Button onClick={onRetry} loading={isRetrying} className="mt-2">
        Retry
      </Button>
    </Alert>
  );
}
