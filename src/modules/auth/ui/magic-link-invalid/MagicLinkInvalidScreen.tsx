import { Alert } from "@/modules/ui/Alert/Alert";
import { Button } from "@/modules/ui/Button/Button";

export type MagicLinkInvalidScreenState = "default" | "loading" | "error-rate-limited";

export type MagicLinkInvalidScreenProps = {
  state: MagicLinkInvalidScreenState;
  onSendNewLink: () => void;
};

export function MagicLinkInvalidScreen({ state, onSendNewLink }: MagicLinkInvalidScreenProps) {
  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4 px-6 py-16">
      <h1 className="text-lg font-semibold text-slate-900">This link is no longer valid</h1>

      {state === "error-rate-limited" ? (
        <Alert variant="error">Too many requests. Wait a bit before trying again.</Alert>
      ) : (
        <>
          <Alert variant="error">
            It may have expired, already been used, or been replaced by a newer one.
          </Alert>
          <Button variant="primary" onClick={onSendNewLink} loading={state === "loading"}>
            Send a new link
          </Button>
        </>
      )}
    </div>
  );
}
