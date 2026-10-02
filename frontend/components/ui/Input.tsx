"use client";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  error?: string;
  /**
   * エラー文言の表示位置。入力欄の下に出すと横並びの要素がずれる場合に"above"を使う。
   */
  errorPlacement?: "below" | "above";
}

export function Input({
  label,
  name,
  error,
  errorPlacement = "below",
  id,
  className = "",
  ...rest
}: InputProps) {
  const inputId = id ?? name;
  const errorId = `${inputId}-error`;
  return (
    <div>
      <label
        htmlFor={inputId}
        className="mb-1 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>
      {error && errorPlacement === "above" && (
        <p id={errorId} className="mb-1 text-sm text-red-600">
          {error}
        </p>
      )}
      <input
        id={inputId}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`block min-h-11 w-full rounded-md border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
          error ? "border-red-500" : "border-slate-300"
        } ${className}`}
        {...rest}
      />
      {error && errorPlacement === "below" && (
        <p id={errorId} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
