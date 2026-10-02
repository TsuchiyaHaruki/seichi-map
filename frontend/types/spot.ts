export type Category = "GAME" | "ANIME" | "GAME_AND_ANIME";

export type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED";

/** 信頼性ラベル(投稿者ロールと確認状態から生成される表示文字列) */
export type TrustLabel = "管理者登録" | "管理者確認済み" | "確認待ち" | "却下";

/** 信頼性区分絞り込み(ADMIN=管理者登録 / USER=管理者確認済み) */
export type RegistrantType = "ADMIN" | "USER";

/** 一覧API(GET /api/v1/sacred-spots)の1件分 */
export interface SpotListItem {
  id: number;
  workName: string;
  spotName: string;
  category: Category;
  address: string;
  latitude: number;
  longitude: number;
  trustLabel: TrustLabel;
  likeCount: number;
}

/** 地図API(GET /api/v1/sacred-spots/map)の1件分 */
export interface SpotMapItem {
  id: number;
  workName: string;
  spotName: string;
  latitude: number;
  longitude: number;
  trustLabel: TrustLabel;
}

/** 詳細API(GET /api/v1/sacred-spots/{id}) */
export interface SpotDetail {
  id: number;
  workName: string;
  spotName: string;
  category: Category;
  address: string;
  prefecture: string | null;
  latitude: number;
  longitude: number;
  sceneDescription: string | null;
  description: string | null;
  sourceUrl: string | null;
  sourceDescription: string | null;
  googlePlaceId: string | null;
  registrantName: string;
  trustLabel: TrustLabel;
  likeCount: number;
  likedByCurrentUser: boolean;
  favoritedByCurrentUser: boolean;
  createdAt: string;
  updatedAt: string;
}

/** 聖地登録・編集リクエスト(POST/PUT /api/v1/sacred-spots) */
export interface SpotRequest {
  workName: string;
  spotName: string;
  category: Category;
  address: string;
  prefecture?: string;
  latitude: number;
  longitude: number;
  sceneDescription?: string;
  description?: string;
  sourceUrl?: string;
  sourceDescription?: string;
  googlePlaceId?: string;
}

/** 聖地画像(GET /api/v1/sacred-spots/{spotId}/images) */
export interface SpotImage {
  id: number;
  spotId: number;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
}

/** 検索条件(URL Query Parametersと同期する) */
export interface SpotSearchParams {
  keyword?: string;
  category?: Category;
  prefecture?: string;
  registrantType?: RegistrantType;
  /** 自分がいいねした聖地だけに絞る(ログイン時のみ有効) */
  likedOnly?: boolean;
  /** 自分がお気に入りした聖地だけに絞る(ログイン時のみ有効) */
  favoritedOnly?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

/** マイページの自分の投稿(GET /api/v1/users/me/posts) */
export interface MyPostItem {
  id: number;
  workName: string;
  spotName: string;
  category: Category;
  address: string;
  latitude: number;
  longitude: number;
  verificationStatus: VerificationStatus;
  rejectionReason: string | null;
  trustLabel: TrustLabel;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}
