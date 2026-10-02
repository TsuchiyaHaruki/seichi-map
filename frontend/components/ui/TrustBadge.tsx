import type { TrustLabel } from "@/types/spot";

interface TrustBadgeProps {
  label: TrustLabel;
}

/** 信頼性ラベルの文字色。バッジ以外(地図の吹き出しなど)でも色を揃えるために公開する */
export const TRUST_TEXT_CLASSES: Record<TrustLabel, string> = {
  管理者登録: "text-blue-800",
  管理者確認済み: "text-green-800",
  確認待ち: "text-yellow-800",
  却下: "text-red-800",
};

const BADGE_CLASSES: Record<TrustLabel, string> = {
  管理者登録: `bg-blue-100 border-blue-300 ${TRUST_TEXT_CLASSES["管理者登録"]}`,
  管理者確認済み: `bg-green-100 border-green-300 ${TRUST_TEXT_CLASSES["管理者確認済み"]}`,
  確認待ち: `bg-yellow-100 border-yellow-300 ${TRUST_TEXT_CLASSES["確認待ち"]}`,
  却下: `bg-red-100 border-red-300 ${TRUST_TEXT_CLASSES["却下"]}`,
};

function BadgeIcon({ label }: { label: TrustLabel }) {
  const common = {
    "aria-hidden": true,
    className: "h-3.5 w-3.5 shrink-0",
    viewBox: "0 0 20 20",
    fill: "currentColor",
  } as const;
  switch (label) {
    case "管理者登録":
      // 盾アイコン
      return (
        <svg {...common}>
          <path
            fillRule="evenodd"
            d="M10 1.5l7 2.5v5c0 4.5-3 8.2-7 9.5-4-1.3-7-5-7-9.5V4l7-2.5z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "管理者確認済み":
      // チェックアイコン
      return (
        <svg {...common}>
          <path
            fillRule="evenodd"
            d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "確認待ち":
      // 時計アイコン
      return (
        <svg {...common}>
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.4.8l2.7 2a1 1 0 101.2-1.6L11 9.5V6z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "却下":
      // ×アイコン
      return (
        <svg {...common}>
          <path
            fillRule="evenodd"
            d="M5.3 5.3a1 1 0 011.4 0L10 8.6l3.3-3.3a1 1 0 111.4 1.4L11.4 10l3.3 3.3a1 1 0 01-1.4 1.4L10 11.4l-3.3 3.3a1 1 0 01-1.4-1.4L8.6 10 5.3 6.7a1 1 0 010-1.4z"
            clipRule="evenodd"
          />
        </svg>
      );
  }
}

export function TrustBadge({ label }: TrustBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${BADGE_CLASSES[label]}`}
    >
      <BadgeIcon label={label} />
      {label}
    </span>
  );
}
