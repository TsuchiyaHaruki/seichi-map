"use client";

import { Button } from "@/components/ui/Button";

interface ErrorMessageProps {
  message: string | null;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  if (!message) {
    return null;
  }
  return (
    <div
      role="alert"
      className="rounded-md border border-red-300 bg-red-50 p-4"
    >
      <p className="text-sm text-red-700">{message}</p>
      {onRetry && (
        <div className="mt-3">
          <Button variant="secondary" size="sm" onClick={onRetry}>
            再試行
          </Button>
        </div>
      )}
    </div>
  );
}
