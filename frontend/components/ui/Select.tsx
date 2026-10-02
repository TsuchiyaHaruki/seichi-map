"use client";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  name: string;
  error?: string;
  children: React.ReactNode;
}

export function Select({
  label,
  name,
  error,
  id,
  className = "",
  children,
  ...rest
}: SelectProps) {
  const selectId = id ?? name;
  const errorId = `${selectId}-error`;
  return (
    <div>
      <label
        htmlFor={selectId}
        className="mb-1 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>
      <select
        id={selectId}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`block min-h-11 w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
          error ? "border-red-500" : "border-slate-300"
        } ${className}`}
        {...rest}
      >
        {children}
      </select>
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
