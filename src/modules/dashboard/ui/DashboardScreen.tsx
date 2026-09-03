import { Alert } from "@/modules/ui/Alert/Alert";
import { EmptyState } from "@/modules/ui/EmptyState/EmptyState";
import { Header } from "@/modules/ui/Header/Header";
import { Spinner } from "@/modules/ui/Spinner/Spinner";

export type DashboardScreenState = "loading" | "default";

export type DashboardScreenProps = {
  state: DashboardScreenState;
  onLogout: () => void;
  linked?: boolean;
};

export function DashboardScreen({ state, onLogout, linked }: DashboardScreenProps) {
  return (
    <div>
      <Header title="daysleft" onLogout={onLogout} />
      {state === "loading" ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <>
          {linked && <Alert variant="success">Signed in to your existing account.</Alert>}
          <EmptyState heading="Nothing tracked yet." body="Future: add your first trip here." />
        </>
      )}
    </div>
  );
}
