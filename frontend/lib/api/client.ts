import type { ApiErrorBody } from "@/types/api";
import { clearCsrfToken, ensureCsrfToken } from "@/lib/csrf";
import { buildApiUrl, type SearchParams } from "@/lib/api/url";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const MUTATING_METHODS: HttpMethod[] = ["POST", "PUT", "PATCH", "DELETE"];

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly errors: Record<string, string>;

  constructor(
    status: number,
    code: string,
    message: string,
    errors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

/** 画像など、APIのURLを直接参照したいときに使う(imgのsrcなど) */
export function apiUrl(path: string): string {
  return buildApiUrl(path);
}

export interface ApiFetchOptions {
  method?: HttpMethod;
  /** FormDataを渡すとmultipart/form-dataで送信する(画像アップロード) */
  body?: unknown;
  /** undefined・空文字の値は送信しない */
  searchParams?: SearchParams;
  signal?: AbortSignal;
}

async function parseError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    return new ApiError(
      body.status ?? response.status,
      body.code ?? "UNKNOWN_ERROR",
      body.message ?? "エラーが発生しました。",
      body.errors ?? {},
    );
  } catch {
    return new ApiError(
      response.status,
      "UNKNOWN_ERROR",
      "エラーが発生しました。時間をおいて再度お試しください。",
    );
  }
}

async function doFetch(
  path: string,
  options: ApiFetchOptions,
  csrfRetry: boolean,
): Promise<Response> {
  const method = options.method ?? "GET";
  const headers: Record<string, string> = {};
  let body: BodyInit | undefined;

  if (options.body !== undefined) {
    if (options.body instanceof FormData) {
      // Content-Typeは境界文字列を含めてブラウザに設定させる
      body = options.body;
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(options.body);
    }
  }
  if (MUTATING_METHODS.includes(method)) {
    headers["X-XSRF-TOKEN"] = await ensureCsrfToken();
  }

  let response: Response;
  try {
    response = await fetch(buildApiUrl(path, options.searchParams), {
      method,
      headers,
      body,
      credentials: "include",
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "サーバーへ接続できませんでした。通信環境を確認してください。",
    );
  }

  // CSRFトークン失効時は1回だけ再取得して再試行する
  if (response.status === 403 && csrfRetry && MUTATING_METHODS.includes(method)) {
    const error = await parseError(response.clone());
    if (error.code === "CSRF_TOKEN_INVALID") {
      clearCsrfToken();
      return doFetch(path, options, false);
    }
  }
  return response;
}

/**
 * バックエンドAPIへの共通fetch処理。
 * - `credentials: "include"` でHttpOnly CookieのJWTを送信する
 * - 状態変更メソッドでは `X-XSRF-TOKEN` ヘッダーを自動付与する
 * - エラー時は統一エラーレスポンスを {@link ApiError} として送出する
 */
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const response = await doFetch(path, options, true);
  if (!response.ok) {
    throw await parseError(response);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  const text = await response.text();
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}
