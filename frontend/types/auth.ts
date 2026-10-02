export type Role = "USER" | "ADMIN";

/** ログイン中ユーザーの概要(GET /api/v1/auth/me) */
export interface UserSummary {
  id: number;
  userName: string;
  role: Role;
}

export interface RegisterRequest {
  userName: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}

export interface RegisterResponse {
  id: number;
  userName: string;
  email: string;
  role: Role;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  authenticated: boolean;
  user: UserSummary;
}
