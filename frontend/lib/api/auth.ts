import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  UserSummary,
} from "@/types/auth";
import { apiFetch, ApiError } from "@/lib/api/client";
import { clearCsrfToken } from "@/lib/csrf";

export async function register(
  request: RegisterRequest,
): Promise<RegisterResponse> {
  return apiFetch<RegisterResponse>("/api/v1/auth/register", {
    method: "POST",
    body: request,
  });
}

export async function login(request: LoginRequest): Promise<LoginResponse> {
  const response = await apiFetch<LoginResponse>("/api/v1/auth/login", {
    method: "POST",
    body: request,
  });
  // ログインでCSRFトークンが再生成されるためキャッシュを破棄する
  clearCsrfToken();
  return response;
}

export async function logout(): Promise<void> {
  await apiFetch<void>("/api/v1/auth/logout", { method: "POST" });
  clearCsrfToken();
}

/** 未ログイン(401)の場合はnullを返す */
export async function fetchCurrentUser(): Promise<UserSummary | null> {
  try {
    return await apiFetch<UserSummary>("/api/v1/auth/me");
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}
