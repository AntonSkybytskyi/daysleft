import { Alert } from "@/modules/ui/Alert/Alert";
import { EmptyState } from "@/modules/ui/EmptyState/EmptyState";
import { Header } from "@/modules/ui/Header/Header";
import { Spinner } from "@/modules/ui/Spinner/Spinner";

export type DashboardScreenState = "loading" | "default" | "error" | "error-logout-failed";

export type DashboardScreenStrings = {
  emptyHeading: string;
  emptyBody: string;
  linkedAccount: string;
  logout: string;
  errorFetchFailed: string;
  errorLogoutFailed: string;
};

const defaultStrings: DashboardScreenStrings = {
  emptyHeading: "Nothing tracked yet.",
  emptyBody: "Future: add your first trip here.",
  linkedAccount: "Signed in to your existing account.",
  logout: "Log out",
  errorFetchFailed: "Couldn't load your dashboard. Check your connection and try again.",
  errorLogoutFailed: "Couldn't sign you out. You're still signed in — try again.",
};

export type DashboardScreenProps = {
  state: DashboardScreenState;
  onLogout: () => void;
  linked?: boolean;
  strings?: Partial<DashboardScreenStrings>;
};

export function DashboardScreen({ state, onLogout, linked, strings }: DashboardScreenProps) {
  const t = { ...defaultStrings, ...strings };
  return (
    <div>
      <Header title="daysleft" onLogout={onLogout} logoutLabel={t.logout} />
      {state === "loading" && (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      )}
      {state === "error" && <Alert variant="error">{t.errorFetchFailed}</Alert>}
      {state === "error-logout-failed" && <Alert variant="error">{t.errorLogoutFailed}</Alert>}
      {state === "default" && (
        <>
          {linked && <Alert variant="success">{t.linkedAccount}</Alert>}
          <EmptyState heading={t.emptyHeading} body={t.emptyBody} />
        </>
      )}
    </div>
  );
}
