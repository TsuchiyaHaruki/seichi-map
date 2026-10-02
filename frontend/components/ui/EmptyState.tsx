interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-8 text-center">
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {description && (
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      )}
    </div>
  );
}
