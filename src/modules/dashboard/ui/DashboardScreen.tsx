import { EmptyState } from "@/modules/ui/EmptyState/EmptyState";
import { Header } from "@/modules/ui/Header/Header";
import { Spinner } from "@/modules/ui/Spinner/Spinner";

export type DashboardScreenState = "loading" | "default";

export type DashboardScreenProps = {
  state: DashboardScreenState;
  onLogout: () => void;
};

export function DashboardScreen({ state, onLogout }: DashboardScreenProps) {
  return (
    <div>
      <Header title="daysleft" onLogout={onLogout} />
      {state === "loading" ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <EmptyState heading="Nothing tracked yet." body="Future: add your first trip here." />
      )}
    </div>
  );
}
