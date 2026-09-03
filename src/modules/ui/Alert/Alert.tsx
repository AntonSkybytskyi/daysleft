type AlertProps = {
  variant: "info" | "error";
  children: React.ReactNode;
};

const variantClasses: Record<AlertProps["variant"], string> = {
  info: "bg-slate-50 text-slate-900 border-slate-200",
  error: "bg-red-50 text-red-900 border-red-200",
};

export function Alert({ variant, children }: AlertProps) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`rounded-md border px-4 py-3 text-sm ${variantClasses[variant]}`}
    >
      {children}
    </div>
  );
}
