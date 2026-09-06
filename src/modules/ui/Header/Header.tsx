import { Button } from "../Button/Button";

type HeaderProps = {
  title: string;
  onLogout?: () => void;
  logoutLabel?: string;
};

export function Header({ title, onLogout, logoutLabel = "Log out" }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        {/* A page places a narrow-screen navigation control here (sad.md §2, AC-12) —
            e.g. the destinations list toggle, portaled in rather than threaded as a prop
            so the shell stays unaware of what any feature puts in it. */}
        <div id="app-header-nav-slot" />
      </div>
      {onLogout && (
        <Button variant="secondary" onClick={onLogout}>
          {logoutLabel}
        </Button>
      )}
    </header>
  );
}
