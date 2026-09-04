import type { ButtonHTMLAttributes } from "react";
import { Spinner } from "../Spinner/Spinner";

type LinkButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
};

export function LinkButton({ loading = false, disabled, children, className, ...rest }: LinkButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-label={typeof children === "string" ? children : undefined}
      className={`inline-flex items-center gap-1.5 text-sm font-medium text-slate-900 underline underline-offset-2 disabled:opacity-60 ${className ?? ""}`}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
