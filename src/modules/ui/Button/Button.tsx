import type { ButtonHTMLAttributes } from "react";
import { Spinner } from "../Spinner/Spinner";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  loading?: boolean;
};

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-slate-900 text-white hover:bg-slate-800",
  secondary: "bg-white text-slate-900 border border-slate-300 hover:bg-slate-50",
};

export function Button({ variant = "primary", loading = false, disabled, children, className, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-label={typeof children === "string" ? children : undefined}
      className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-60 ${variantClasses[variant]} ${className ?? ""}`}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
