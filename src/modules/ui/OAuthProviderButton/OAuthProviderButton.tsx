import { Spinner } from "../Spinner/Spinner";

type Provider = "google" | "github";

const providerLabels: Record<Provider, string> = {
  google: "Continue with Google",
  github: "Continue with GitHub",
};

type OAuthProviderButtonProps = {
  provider: Provider;
  onClick?: () => void;
  loading?: boolean;
  label?: string;
};

export function OAuthProviderButton({ provider, onClick, loading = false, label }: OAuthProviderButtonProps) {
  const text = label ?? providerLabels[provider];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      aria-label={text}
      className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 disabled:opacity-60"
    >
      {loading && <Spinner />}
      {text}
    </button>
  );
}
