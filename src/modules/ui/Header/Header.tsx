import { Button } from "../Button/Button";

type HeaderProps = {
  title: string;
  onLogout?: () => void;
};

export function Header({ title, onLogout }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
      <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
      {onLogout && (
        <Button variant="secondary" onClick={onLogout}>
          Log out
        </Button>
      )}
    </header>
  );
}
