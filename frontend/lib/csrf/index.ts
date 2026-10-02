import { buildApiUrl } from "@/lib/api/url";

let cachedToken: string | null = null;

/** ログイン・ログアウト後はトークンが再生成されるためキャッシュを破棄する */
export function clearCsrfToken(): void {
  cachedToken = null;
}

/**
 * CSRFトークンを取得する。
 * キャッシュがなければ GET /api/v1/auth/csrf でトークンを取得する。
 */
export async function ensureCsrfToken(): Promise<string> {
  if (cachedToken) {
    return cachedToken;
  }
  const response = await fetch(buildApiUrl("/api/v1/auth/csrf"), {
    method: "GET",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("CSRFトークンの取得に失敗しました。");
  }
  const body = (await response.json()) as { token: string };
  cachedToken = body.token;
  return cachedToken;
}
