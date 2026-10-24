/** 相対パスの解決にだけ使う架空のオリジン(実在しない .invalid ドメイン) */
const BASE_ORIGIN = "https://redirect.invalid";

/**
 * ログイン後の遷移先として、サイト内のパスだけを許可する(オープンリダイレクト防止)。
 * "/\evil.example" やタブ文字を含む値はブラウザが外部URLとして解釈するため、
 * 先頭の文字だけで判定せず、URLとして解決した結果が同一オリジンの場合だけパスを返す。
 */
export function safeRedirectPath(redirect: string | null): string {
  if (!redirect || !redirect.startsWith("/")) {
    return "/";
  }
  try {
    const url = new URL(redirect, BASE_ORIGIN);
    if (url.origin !== BASE_ORIGIN) {
      return "/";
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}
