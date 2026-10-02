interface SpinnerProps {
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES: Record<NonNullable<SpinnerProps["size"]>, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-4",
};

export function Spinner({ size = "md" }: SpinnerProps) {
  return (
    <span role="status" className="inline-flex items-center justify-center">
      <span
        aria-hidden="true"
        className={`${SIZE_CLASSES[size]} animate-spin rounded-full border-indigo-600 border-t-transparent`}
      />
      <span className="sr-only">読み込み中</span>
    </span>
  );
}
