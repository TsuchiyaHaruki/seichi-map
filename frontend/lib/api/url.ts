/**
 * BackendのベースURL。
 * 空文字の場合は同一オリジンへ送信する(本番ではリバースプロキシが /api/* をBackendへ転送する)。
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export type SearchParams = Record<string, string | number | boolean | undefined>;

/**
 * APIのURLを組み立てる。undefined・空文字の検索パラメーターは送信しない。
 * ベースURLが空文字でも動作するよう、new URL()を使わず相対URLのまま組み立てる。
 */
export function buildApiUrl(
  path: string,
  searchParams?: SearchParams,
  baseUrl: string = API_BASE_URL,
): string {
  const query = new URLSearchParams();
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined && value !== "") {
        query.set(key, String(value));
      }
    }
  }
  const queryString = query.toString();
  return `${baseUrl}${path}${queryString ? `?${queryString}` : ""}`;
}
