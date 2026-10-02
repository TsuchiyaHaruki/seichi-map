"use client";

interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  name: string;
  error?: string;
}

export function TextArea({
  label,
  name,
  error,
  id,
  className = "",
  rows = 4,
  ...rest
}: TextAreaProps) {
  const textareaId = id ?? name;
  const errorId = `${textareaId}-error`;
  return (
    <div>
      <label
        htmlFor={textareaId}
        className="mb-1 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>
      <textarea
        id={textareaId}
        name={name}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`block w-full rounded-md border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
          error ? "border-red-500" : "border-slate-300"
        } ${className}`}
        {...rest}
      />
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
