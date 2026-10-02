import type { VerificationStatus } from "@/types/spot";
import { VERIFICATION_STATUS_LABELS } from "@/lib/constants";

interface StatusBadgeProps {
  status: VerificationStatus;
}

const STATUS_CLASSES: Record<VerificationStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
  VERIFIED: "bg-green-100 text-green-800 border-green-300",
  REJECTED: "bg-red-100 text-red-800 border-red-300",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[status]}`}
    >
      {VERIFICATION_STATUS_LABELS[status] ?? status}
    </span>
  );
}
