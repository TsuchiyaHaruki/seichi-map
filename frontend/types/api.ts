/** バックエンド共通エラーレスポンス(AI_SPECIFICATION.md §7) */
export interface ApiErrorBody {
  timestamp: string;
  status: number;
  code: string;
  message: string;
  path: string;
  errors?: Record<string, string>;
}

/** ページネーションレスポンス(AI_SPECIFICATION.md §9) */
export interface PageResponse<T> {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  items: T[];
}
