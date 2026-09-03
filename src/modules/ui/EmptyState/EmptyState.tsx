type EmptyStateProps = {
  heading: string;
  body: string;
};

export function EmptyState({ heading, body }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
      <h2 className="text-base font-semibold text-slate-900">{heading}</h2>
      <p className="text-sm text-slate-600">{body}</p>
    </div>
  );
}
