import type { Category, RegistrantType, TrustLabel } from "@/types/spot";

export const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: "GAME", label: "ゲーム" },
  { value: "ANIME", label: "アニメ" },
  { value: "GAME_AND_ANIME", label: "ゲーム・アニメ" },
];

export function categoryLabel(category: Category): string {
  return (
    CATEGORY_OPTIONS.find((option) => option.value === category)?.label ??
    category
  );
}

export const REGISTRANT_TYPE_OPTIONS: {
  value: RegistrantType;
  label: TrustLabel;
}[] = [
  { value: "ADMIN", label: "管理者登録" },
  { value: "USER", label: "管理者確認済み" },
];

export const VERIFICATION_STATUS_LABELS: Record<string, string> = {
  PENDING: "確認待ち",
  VERIFIED: "承認済み",
  REJECTED: "却下",
};

export const PREFECTURES: string[] = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
];

export const DEFAULT_PAGE_SIZE = 20;
