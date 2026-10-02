import type { Category, TrustLabel, VerificationStatus } from "./spot";
import type { Role } from "./auth";

/** 管理者向け聖地一覧(GET /api/v1/admin/sacred-spots)の1件分 */
export interface AdminSpotItem {
  id: number;
  workName: string;
  spotName: string;
  category: Category;
  address: string;
  verificationStatus: VerificationStatus;
  trustLabel: TrustLabel;
  registrantName: string;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

/** 管理者向けユーザー一覧(GET /api/v1/admin/users)の1件分 */
export interface AdminUserItem {
  id: number;
  userName: string;
  email: string;
  role: Role;
  enabled: boolean;
  failedAttempts: number;
  locked: boolean;
  lockedAt: string | null;
  createdAt: string;
}

/** 却下リクエスト(PATCH /api/v1/admin/sacred-spots/{id}/reject) */
export interface RejectRequest {
  reason: string;
}
