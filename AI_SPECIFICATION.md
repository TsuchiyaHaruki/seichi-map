# AI-Ready System Specification: ノベルゲーム聖地巡礼アプリ

本ドキュメントは、AIコード生成エージェントおよび開発者が「ノベルゲーム聖地巡礼アプリ」を実装するための技術仕様書である。

実装時は、本仕様書を機能・画面・DB・API・認証・セキュリティの基準とする。

---

## 1. システム概要

### 1.1 アプリの目的

本アプリは、ノベルゲームおよびノベルゲームを原作としたアニメ作品の聖地を、地図上で検索・閲覧・投稿できるWebアプリケーションである。

利用者は以下を行える。

- 作品名や聖地名による検索
- 地図上での聖地確認
- 聖地詳細モーダルの閲覧
- 現在地から聖地までの直線距離確認
- Googleマップによる徒歩経路確認
- 聖地情報の投稿
- いいね
- お気に入り登録

一般利用者が投稿した聖地情報は、管理者の承認後に一般公開する。

管理者が直接登録した情報と、利用者が投稿して管理者が確認した情報を区別して表示し、情報の出所と信頼性を分かりやすくする。

### 1.2 対象端末

- PC
- タブレット
- スマートフォン

スマートフォンで聖地巡礼中に利用することを重視する。

---

## 2. 技術スタック

### Frontend

- Next.js
- App Router
- TypeScript
- Tailwind CSS
- React
- Fetch API
- Google Maps JavaScript API
- Advanced Markers
- Geocoding API

### Backend

- Java
- Spring Boot
- Spring MVC
- Spring Security
- Spring Data JPA
- Hibernate
- Bean Validation
- Flyway

### Database

- PostgreSQL

### Development

- Maven
- Maven Wrapper
- Node.js
- npm
- Docker
- Docker Compose
- Git
- GitHub

### 基本構成

```text
Browser
  ↓
Next.js + TypeScript + Tailwind CSS
  ↓ JSON API
Spring Boot + Spring Security
  ↓
PostgreSQL
```

推奨ディレクトリ：

```text
project-root/
├── frontend/
├── backend/
├── docs/
├── AGENTS.md
├── CLAUDE.md
├── AI_SPECIFICATION.md
└── compose.yml
```

---

## 3. ロールと権限

| 区分 | ID | 権限 |
|---|---|---|
| 未ログイン利用者 | `GUEST` | 承認済み聖地の閲覧、検索、地図表示、詳細モーダル、現在地・距離表示、Googleマップ連携 |
| 一般利用者 | `USER` | `GUEST`の機能に加え、聖地投稿、自分の投稿管理、いいね、お気に入り、マイページ |
| 管理者 | `ADMIN` | `USER`の機能に加え、投稿承認・却下、聖地管理、ユーザー管理、アカウントロック解除 |

### 権限ルール

- 権限の最終判定はSpring Boot側で行う。
- Next.js側でボタンを非表示にするだけでは不十分。
- リクエスト本文のユーザーIDやロールを信用しない。
- 操作ユーザーはJWTから取得する。
- USERは他人の投稿を編集・削除できない。
- USERは管理者APIを実行できない。
- 一般ユーザー登録時に`ADMIN`を指定できない。

---

## 4. 認証・セッション仕様

### 認証方式

JWTを使用する。

JWTはSpring Bootで発行し、ブラウザのHttpOnly Cookieに保存する。

Cookie例：

```text
access_token
```

Cookie属性：

- `HttpOnly`
- `Secure`：本番環境のみ
- `SameSite=Lax`
- `Path=/`
- 有効期限30分

### JWTに含める情報

```text
userId
email
role
issuedAt
expiresAt
```

パスワードなどの機密情報は含めない。

### スライディングセッション

- JWTの有効期限は発行から30分。
- 認証済みAPI実行時、残り15分未満なら再発行する。
- ログアウト時はCookieを削除する。

### CSRF

JWTをCookieで送信するため、状態変更APIではCSRF対策を行う。

- Spring SecurityのCSRF機能を使用する。
- Next.jsは`POST`、`PUT`、`PATCH`、`DELETE`時にCSRFトークンを送る。
- CSRF対策を無効化しない。

ヘッダー例：

```text
X-XSRF-TOKEN
```

### CORS

開発環境例：

```text
Frontend: http://localhost:3000
Backend:  http://localhost:8080
```

- 許可するFrontendオリジンを明示する。
- Cookie利用時にワイルドカードを使用しない。
- Next.jsの`fetch`では`credentials: "include"`を使用する。

### アカウントロック

- ログイン失敗回数の初期上限は5回。
- 失敗時に`failed_attempts`を増加。
- 上限到達時に`is_locked = true`。
- ロック時に`locked_at`を記録。
- ロック中はログインを拒否。
- 成功時は失敗回数を0に戻す。
- 管理者だけが解除可能。
- 上限は`system_settings`で管理。

---

## 5. 聖地情報の状態

```text
PENDING
VERIFIED
REJECTED
```

### USERの新規投稿

必ず`PENDING`で保存する。

### ADMINの直接登録

登録時点で`VERIFIED`にできる。

### 承認

```text
verification_status = VERIFIED
verified_by = 操作した管理者ID
verified_at = 現在日時
rejection_reason = NULL
```

### 却下

却下理由を必須とする。

```text
verification_status = REJECTED
verified_by = 操作した管理者ID
verified_at = 現在日時
rejection_reason = 入力された理由
```

### USERによる再編集

承認済み投稿をUSERが編集した場合：

```text
verification_status = PENDING
verified_by = NULL
verified_at = NULL
rejection_reason = NULL
```

### 公開条件

一般向けの一覧、検索、地図、詳細APIには原則として`VERIFIED`のみ返す。

投稿者本人は、自分の`PENDING`と`REJECTED`をマイページで確認できる。

### 信頼性ラベル

| 条件 | 表示 |
|---|---|
| ADMIN投稿かつ`VERIFIED` | 管理者登録 |
| USER投稿かつ`VERIFIED` | 管理者確認済み |
| `PENDING` | 確認待ち |
| `REJECTED` | 却下 |

ラベルはDBへ保存せず、投稿者ロールと状態から生成する。

---

## 6. データベース設計

主キーには`BIGSERIAL`を使用する。

### users

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    user_name VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    locked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_users_role
        CHECK (role IN ('USER', 'ADMIN')),
    CONSTRAINT chk_users_failed_attempts
        CHECK (failed_attempts >= 0)
);
```

### sacred_spots

```sql
CREATE TABLE sacred_spots (
    id BIGSERIAL PRIMARY KEY,
    work_name VARCHAR(100) NOT NULL,
    spot_name VARCHAR(100) NOT NULL,
    category VARCHAR(30) NOT NULL,
    address VARCHAR(255) NOT NULL,
    prefecture VARCHAR(50),
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    scene_description VARCHAR(500),
    description TEXT,
    source_url VARCHAR(500),
    source_description VARCHAR(500),
    google_place_id VARCHAR(255),
    created_by BIGINT NOT NULL,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    verified_by BIGINT,
    verified_at TIMESTAMPTZ,
    rejection_reason VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sacred_spots_created_by
        FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_sacred_spots_verified_by
        FOREIGN KEY (verified_by) REFERENCES users(id),
    CONSTRAINT chk_sacred_spots_category
        CHECK (category IN ('GAME', 'ANIME', 'GAME_AND_ANIME')),
    CONSTRAINT chk_sacred_spots_status
        CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
    CONSTRAINT chk_sacred_spots_latitude
        CHECK (latitude BETWEEN -90 AND 90),
    CONSTRAINT chk_sacred_spots_longitude
        CHECK (longitude BETWEEN -180 AND 180)
);
```

### likes

```sql
CREATE TABLE likes (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    spot_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_likes_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_likes_spot
        FOREIGN KEY (spot_id) REFERENCES sacred_spots(id) ON DELETE CASCADE,
    CONSTRAINT uq_likes_user_spot
        UNIQUE (user_id, spot_id)
);
```

### favorites

```sql
CREATE TABLE favorites (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    spot_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_favorites_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_favorites_spot
        FOREIGN KEY (spot_id) REFERENCES sacred_spots(id) ON DELETE CASCADE,
    CONSTRAINT uq_favorites_user_spot
        UNIQUE (user_id, spot_id)
);
```

### system_settings

```sql
CREATE TABLE system_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value VARCHAR(255) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO system_settings (setting_key, setting_value)
VALUES ('max_failed_attempts', '5');
```

### 推奨インデックス

```sql
CREATE INDEX idx_sacred_spots_status
    ON sacred_spots (verification_status);

CREATE INDEX idx_sacred_spots_created_by
    ON sacred_spots (created_by);

CREATE INDEX idx_sacred_spots_created_at
    ON sacred_spots (created_at DESC);

CREATE INDEX idx_sacred_spots_work_name
    ON sacred_spots (work_name);

CREATE INDEX idx_sacred_spots_spot_name
    ON sacred_spots (spot_name);

CREATE INDEX idx_likes_spot_id
    ON likes (spot_id);

CREATE INDEX idx_favorites_user_id
    ON favorites (user_id);
```

---

## 7. API共通仕様

### ベースURL

```text
/api/v1
```

### 形式

- `application/json`
- プロパティ名は`camelCase`
- 日時はISO 8601
- Entityを直接返さずDTOを使用
- Cookie送信は`credentials: "include"`

### ページネーション

```text
page=0
size=20
sort=createdAt,desc
```

`size`の最大値は100。

### エラーレスポンス

```json
{
  "timestamp": "2026-07-18T07:00:00Z",
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "入力内容を確認してください。",
  "path": "/api/v1/sacred-spots",
  "errors": {
    "workName": "作品名は必須です。"
  }
}
```

### HTTPステータス

| Status | 用途 |
|---:|---|
| `200` | 取得・更新成功 |
| `201` | 新規登録成功 |
| `204` | 削除成功 |
| `400` | 入力値不正 |
| `401` | 未認証 |
| `403` | 権限不足 |
| `404` | 対象なし |
| `409` | 重複・状態競合 |
| `422` | 業務ルール上処理不可 |
| `500` | サーバー内部エラー |

---

## 8. 認証API

### `POST /api/v1/auth/register`

Request:

```json
{
  "userName": "tutti",
  "email": "tutti@example.com",
  "password": "SecurePassword123",
  "passwordConfirmation": "SecurePassword123"
}
```

Response `201`:

```json
{
  "id": 1,
  "userName": "tutti",
  "email": "tutti@example.com",
  "role": "USER"
}
```

### `POST /api/v1/auth/login`

Request:

```json
{
  "email": "tutti@example.com",
  "password": "SecurePassword123"
}
```

Response `200`:

```json
{
  "authenticated": true,
  "user": {
    "id": 1,
    "userName": "tutti",
    "role": "USER"
  }
}
```

JWTはHttpOnly Cookieで返す。

### `POST /api/v1/auth/logout`

Response:

```text
204 No Content
```

### `GET /api/v1/auth/me`

Response:

```json
{
  "id": 1,
  "userName": "tutti",
  "role": "USER"
}
```

### `GET /api/v1/auth/csrf`

CSRFトークンを取得する。

---

## 9. 聖地API

### `GET /api/v1/sacred-spots`

Query Parameters:

- `keyword`
- `category`
- `prefecture`
- `registrantType`
- `likedOnly`
- `favoritedOnly`
- `page`
- `size`
- `sort`

検索ルール：

- `keyword`は作品名、聖地名、住所、登場場面を対象とする。
- 異なる検索条件はAND。
- 一般公開APIは`VERIFIED`のみ。
- `likedOnly=true`はログイン利用者本人がいいねした聖地だけに絞る。
- `favoritedOnly=true`はログイン利用者本人がお気に入りした聖地だけに絞る。
- 未ログインで`likedOnly`または`favoritedOnly`を指定した場合は0件を返す。

Response:

```json
{
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1,
  "items": [
    {
      "id": 1,
      "workName": "CLANNAD",
      "spotName": "瑞穂運動場東駅周辺",
      "category": "GAME_AND_ANIME",
      "address": "愛知県名古屋市瑞穂区",
      "latitude": 35.122500,
      "longitude": 136.947800,
      "trustLabel": "管理者確認済み",
      "likeCount": 25
    }
  ]
}
```

### `GET /api/v1/sacred-spots/map`

Query Parametersは一覧と同じ絞り込み条件(`keyword`、`category`、`prefecture`、`registrantType`、`likedOnly`、`favoritedOnly`)を受け付ける。

```json
[
  {
    "id": 1,
    "workName": "CLANNAD",
    "spotName": "瑞穂運動場東駅周辺",
    "latitude": 35.122500,
    "longitude": 136.947800,
    "trustLabel": "管理者確認済み"
  }
]
```

### `GET /api/v1/sacred-spots/{id}`

聖地詳細モーダル用。

```json
{
  "id": 1,
  "workName": "CLANNAD",
  "spotName": "瑞穂運動場東駅周辺",
  "category": "GAME_AND_ANIME",
  "address": "愛知県名古屋市瑞穂区",
  "prefecture": "愛知県",
  "latitude": 35.122500,
  "longitude": 136.947800,
  "sceneDescription": "主人公たちの通学路のモデル",
  "description": "駅周辺の風景が作品内に登場する。",
  "sourceUrl": "https://example.com",
  "sourceDescription": "作品背景と現地写真を比較",
  "googlePlaceId": "optional-place-id",
  "registrantName": "tutti",
  "trustLabel": "管理者確認済み",
  "likeCount": 25,
  "likedByCurrentUser": false,
  "favoritedByCurrentUser": true,
  "createdAt": "2026-07-18T05:00:00Z",
  "updatedAt": "2026-07-18T06:00:00Z"
}
```

公開レスポンスへ投稿者のメールアドレスを含めない。

### `POST /api/v1/sacred-spots`

ログイン必須。

Request:

```json
{
  "workName": "CLANNAD",
  "spotName": "瑞穂運動場東駅周辺",
  "category": "GAME_AND_ANIME",
  "address": "愛知県名古屋市瑞穂区",
  "prefecture": "愛知県",
  "latitude": 35.122500,
  "longitude": 136.947800,
  "sceneDescription": "主人公たちの通学路のモデル",
  "description": "駅周辺の風景が作品内に登場する。",
  "sourceUrl": "https://example.com",
  "sourceDescription": "作品背景と現地写真を比較",
  "googlePlaceId": "optional-place-id"
}
```

### `PUT /api/v1/sacred-spots/{id}`

- 投稿者本人またはADMIN。
- USERが編集した場合は`PENDING`へ戻す。
- ADMINは`VERIFIED`を維持できる。

### `DELETE /api/v1/sacred-spots/{id}`

- USERは自分の`PENDING`または`REJECTED`のみ削除可能。
- ADMINは任意の投稿を削除可能。

### 聖地画像API

```text
GET    /api/v1/sacred-spots/{spotId}/images
GET    /api/v1/sacred-spots/{spotId}/images/{imageId}
POST   /api/v1/sacred-spots/{spotId}/images
DELETE /api/v1/sacred-spots/{spotId}/images/{imageId}
```

- 実ファイルはサーバーのローカルフォルダへ保存し、DBには所在と属性だけを持つ。
- 保存先は`app.upload.spot-images-dir`(環境変数`SPOT_IMAGE_DIR`)。
- 登録は`multipart/form-data`のパート名`file`。投稿者本人とADMINのみ。
- 1件につき3枚まで、1枚5MBまで。
- 受け入れる形式はJPEG、PNG、WebP。拡張子や申告された種別ではなく、先頭バイトで判定する。
- 参照できる範囲は聖地詳細と同じ。`VERIFIED`は誰でも、`PENDING`と`REJECTED`は投稿者本人とADMINのみ(それ以外は404)。
- 保存するファイル名は利用者の入力を使わずUUIDで生成する。
- 聖地を削除したときはDBの行と実ファイルの両方を削除する。

一覧のResponse:

```json
[
  {
    "id": 1,
    "spotId": 1,
    "originalName": "spot.jpg",
    "contentType": "image/jpeg",
    "sizeBytes": 812345,
    "createdAt": "2026-09-18T00:00:00Z"
  }
]
```

---

## 10. いいね・お気に入りAPI

### いいね

```text
POST   /api/v1/sacred-spots/{id}/likes
DELETE /api/v1/sacred-spots/{id}/likes
```

- ログイン必須。
- `VERIFIED`だけが対象。
- 重複登録禁止。
- いいね数はDBから集計。

### お気に入り

```text
POST   /api/v1/sacred-spots/{id}/favorites
DELETE /api/v1/sacred-spots/{id}/favorites
GET    /api/v1/users/me/favorites
```

- ログイン必須。
- `VERIFIED`だけが対象。
- 重複登録禁止。
- 本人だけが一覧取得可能。

---

## 11. マイページAPI

```text
GET /api/v1/users/me/posts
GET /api/v1/users/me/favorites
GET /api/v1/users/me/likes
```

自分の投稿一覧では、状態と却下理由を確認できる。

---

## 12. 管理者API

すべて`ADMIN`権限必須。

```text
GET    /api/v1/admin/sacred-spots/pending
GET    /api/v1/admin/sacred-spots/{id}
PATCH  /api/v1/admin/sacred-spots/{id}/verify
PATCH  /api/v1/admin/sacred-spots/{id}/reject
PUT    /api/v1/admin/sacred-spots/{id}
DELETE /api/v1/admin/sacred-spots/{id}

GET    /api/v1/admin/users
POST   /api/v1/admin/users/{id}/unlock
PATCH  /api/v1/admin/users/{id}/enabled
```

却下Request:

```json
{
  "reason": "出典を確認できませんでした。"
}
```

---

## 13. 画面仕様

### トップ・地図画面

Route:

```text
/
```

表示内容：

- ヘッダー
- 検索フォーム
- カテゴリー絞り込み
- 都道府県絞り込み
- 信頼性区分絞り込み
- いいね絞り込み(ハートのトグル。ログイン時のみ表示)
- お気に入り絞り込み(星のトグル。ログイン時のみ表示)
- Googleマップ
- 聖地マーカー
- 現在地マーカー
- 聖地一覧
- ページネーション
- 聖地投稿ボタン
- ログイン・ログアウト
- マイページ
- 管理者画面リンク

検索条件はURL Query Parametersと同期する。

### ログイン画面

```text
/login
```

- メールアドレス
- パスワード
- エラー表示
- ロック状態表示

### ユーザー登録画面

```text
/register
```

- ユーザー名
- メールアドレス
- パスワード
- 確認用パスワード

### 聖地登録画面

```text
/spots/new
```

- 作品名
- 聖地名
- カテゴリー
- 住所
- 都道府県
- 緯度
- 経度
- 登場場面
- 説明
- 出典URL
- 出典説明
- 画像(任意。3枚まで、1枚5MBまで、JPEG・PNG・WebP)

画像は聖地本体の登録が終わってから順に送信する。編集画面では登録済み画像の削除もできる。
撮影者本人の写真を使うこと、個人が特定できるものを写さないことを画面に明記する。

### マイページ

```text
/mypage
```

- ユーザー情報
- 自分の投稿
- 投稿状態
- 却下理由
- いいねした聖地
- お気に入り

### 管理者画面

```text
/admin
/admin/spots
/admin/spots/pending
/admin/users
```

- 各状態の件数
- 確認待ち投稿
- 承認・却下
- ユーザー一覧
- ロック解除

---

## 14. 聖地詳細モーダル

詳細は別ページではなく共通モーダルで表示する。

開く場所：

- 地図マーカー
- マーカーのポップアップ
- 聖地一覧
- お気に入り一覧
- 自分の投稿一覧

データ取得：

```text
GET /api/v1/sacred-spots/{id}
```

表示内容：

- 作品名
- 聖地名
- カテゴリー
- 投稿画像(登録がある場合)
- 住所
- 登場場面
- 説明
- 出典
- 投稿者名
- 信頼性ラベル
- 登録日時
- 更新日時
- いいね数
- 現在地からの距離
- いいねボタン
- お気に入りボタン
- Googleマップで経路を見る

操作：

- 閉じるボタン
- 背景クリック
- Escapeキー

アクセシビリティ：

- `role="dialog"`
- `aria-modal="true"`
- `aria-labelledby`
- フォーカストラップ
- 背景スクロール停止
- フォーカス復帰

---

## 15. Googleマップ・Geocoding・現在地

### 15.1 Maps JavaScript API

メイン地図にはGoogle Maps JavaScript APIを使用する。

初期表示：

```typescript
const JAPAN_CENTER = {
  lat: 36.2048,
  lng: 138.2529,
};

const mapOptions: google.maps.MapOptions = {
  center: JAPAN_CENTER,
  zoom: 5,
  minZoom: 4,
  maxZoom: 20,
  mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID,
  zoomControl: true,
  fullscreenControl: true,
  streetViewControl: false,
  mapTypeControl: true,
  gestureHandling: "greedy",
};
```

要件：

- 初期状態で日本全体を確認できる。
- ドラッグ、ズームボタン、ホイール、ピンチで自由に操作できる。
- 検索結果がある場合は`fitBounds()`で対象地点を画面内に収める。
- 一覧から聖地を選択した場合は`panTo()`して適切なズームへ変更する。
- 地図表示に失敗しても聖地一覧と検索を利用可能とする。
- Googleのロゴ、著作権、利用規約表示を隠さない。

### 15.2 ライブラリ読み込み

必要なライブラリを動的に読み込む。

```typescript
const { Map } =
  await google.maps.importLibrary("maps") as google.maps.MapsLibrary;

const { AdvancedMarkerElement, PinElement } =
  await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

const { Geocoder } =
  await google.maps.importLibrary("geocoding") as google.maps.GeocodingLibrary;
```

同じ画面でMaps JavaScript APIを複数回ロードしない。

### 15.3 Advanced Markers

聖地、現在地、登録位置のマーカーにはAdvanced Markersを使用する。

Advanced Markersの利用にはMap IDが必要である。

マーカー区分：

| 種類 | 表示例 |
|---|---|
| 管理者登録 | 青系のピン＋管理者登録ラベル |
| 管理者確認済み | 緑系のピン＋確認済みラベル |
| 現在地 | 現在地専用アイコン |
| 登録位置の仮マーカー | ドラッグ可能なピン |

実装ルール：

- `google.maps.marker.AdvancedMarkerElement`を使用する。
- 新規実装では従来の`google.maps.Marker`を使用しない。
- Map IDは`NEXT_PUBLIC_GOOGLE_MAP_ID`から取得する。
- `DEMO_MAP_ID`は開発時の動作確認だけに使用する。
- 色だけで意味を表現せず、`title`、アイコン、ラベルを併用する。
- 登録件数が増えた場合はマーカークラスタリングを検討する。

### 15.4 Geocoding API

聖地登録画面では、入力した住所をGeocoding APIで緯度・経度へ変換する。

利用者が入力する動的な住所検索には、Maps JavaScript APIの`Geocoder`を使用する。

処理フロー：

```text
住所を入力
↓
「住所から検索」を押す
↓
Geocoding APIで候補座標を取得
↓
Googleマップを候補地点へ移動
↓
ドラッグ可能な仮マーカーを表示
↓
利用者が正確な場所へマーカーを移動
↓
住所・緯度・経度を確認
↓
Spring Bootへ聖地登録リクエストを送信
```

要件：

- API検索中はローディングを表示する。
- 検索ボタンの連打を防止する。
- 結果が0件の場合は住所の修正を促す。
- 複数候補がある場合は候補を選択できるようにする。
- Geocoding結果だけで自動登録しない。
- 利用者が地図上で最終位置を確認・調整できるようにする。
- 仮マーカーのドラッグ後、必要に応じて逆ジオコーディングを行う。
- Geocodingに失敗しても、地図クリックまたはマーカードラッグで座標を指定できるようにする。
- Places APIによる入力候補は現在の必須範囲に含めない。
- Geocoding APIの利用規約、保存制限、表示要件に従う。
- Geocoding結果はGoogleマップ上で表示する。

### 15.5 地図用データ

Spring Bootの地図用APIは必要最小限の情報だけを返す。

```json
{
  "id": 1,
  "workName": "CLANNAD",
  "spotName": "瑞穂運動場東駅周辺",
  "latitude": 35.122500,
  "longitude": 136.947800,
  "trustLabel": "管理者確認済み"
}
```

詳細説明、出典全文、投稿者メールアドレスは地図用APIへ含めない。

### 15.6 現在地

ブラウザのGeolocation APIを使用する。

```javascript
navigator.geolocation.getCurrentPosition()
navigator.geolocation.watchPosition()
```

更新対象：

- 現在地用Advanced Marker
- 選択中の聖地までの直線距離

保存禁止：

- 利用者の現在地
- 位置履歴
- 現在地から聖地までの距離

位置情報を拒否しても他機能を利用可能とする。

監視IDを保持し、不要になった時点で`clearWatch()`を実行する。

### 15.7 Googleマップ経路連携

徒歩経路はGoogle Maps URLで外部表示する。

```text
https://www.google.com/maps/dir/?api=1&destination={latitude},{longitude}&travelmode=walking
```

初期実装ではRoutes APIを使用しない。
アプリ内で道路に沿ったルートや所要時間を表示する場合は、別の仕様変更とする。

### 15.8 APIキー・Map ID・課金設定

Google Cloudで以下を有効化する。

- Maps JavaScript API
- Geocoding API

Frontend環境変数：

```text
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
NEXT_PUBLIC_GOOGLE_MAP_ID
```

セキュリティ要件：

- ブラウザ用APIキーは公開される前提で扱う。
- HTTPリファラー制限を設定する。
- API制限でMaps JavaScript APIとGeocoding APIだけを許可する。
- 開発環境と本番環境でAPIキーとMap IDを分ける。
- ソースコードへキーを直接記述しない。
- Google Cloudで割り当て上限と予算アラートを設定する。
- 本番環境では専用Map IDを使用する。

---

## 16. Tailwind CSS・UI

- Tailwind CSSを使用する。
- モバイルファースト。
- PC、タブレット、スマートフォン対応。
- 色だけで状態を伝えない。
- フォーカス表示を用意。
- タップ対象を十分な大きさにする。
- ローディング、空状態、エラー状態を用意。
- 二重送信を防止。
- 共通UIはコンポーネント化。
- 大量の同一Tailwindクラス列を無秩序に複製しない。

---

## 17. Next.js実装方針

### Component

Server Componentを基本とする。

Client Componentが必要な例：

- Googleマップ
- モーダル
- Geolocation
- いいね・お気に入り
- 動的フォーム

### 推奨構成

```text
frontend/
├── app/
│   ├── admin/
│   ├── login/
│   ├── register/
│   ├── mypage/
│   ├── spots/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── auth/
│   ├── layout/
│   ├── map/
│   ├── modal/
│   ├── spots/
│   └── ui/
├── lib/
│   ├── api/
│   ├── auth/
│   ├── csrf/
│   ├── maps/
│   └── validation/
├── types/
├── public/
└── middleware.ts
```

API通信は`lib/api`へ共通化する。

Next.jsのMiddlewareは画面遷移補助に使えるが、権限の最終判定はSpring Bootで行う。

---

## 18. Spring Boot実装方針

```text
backend/src/main/java/.../
├── config/
├── controller/
│   ├── auth/
│   ├── publicapi/
│   ├── user/
│   └── admin/
├── dto/
│   ├── request/
│   └── response/
├── entity/
├── enums/
├── exception/
├── mapper/
├── repository/
├── security/
├── service/
└── validation/
```

レイヤー：

```text
Controller
↓
Service
↓
Repository
↓
PostgreSQL
```

- Controllerに業務ロジックを書かない。
- Serviceで権限・所有者・状態遷移を判定。
- EntityをAPIへ直接返さない。
- 更新処理に`@Transactional`。
- 例外を`@RestControllerAdvice`で共通処理。

---

## 19. バリデーション

### User

| 項目 | ルール |
|---|---|
| ユーザー名 | 必須、2〜50文字 |
| メールアドレス | 必須、形式確認、255文字以内、重複不可 |
| パスワード | 必須、8文字以上 |
| 確認用パスワード | パスワードと一致 |

### Sacred Spot

| 項目 | ルール |
|---|---|
| 作品名 | 必須、100文字以内 |
| 聖地名 | 必須、100文字以内 |
| カテゴリー | `GAME`、`ANIME`、`GAME_AND_ANIME` |
| 住所 | 必須、255文字以内 |
| 都道府県 | 50文字以内 |
| 緯度 | 必須、-90〜90 |
| 経度 | 必須、-180〜180 |
| 登場場面 | 500文字以内 |
| 説明 | 5000文字以内 |
| 出典URL | URL形式、500文字以内 |
| 出典説明 | 500文字以内 |
| 却下理由 | 却下時必須、500文字以内 |

FrontendとBackendの両方で検証し、Backendを最終判定とする。

---

## 20. 非機能要件

### パフォーマンス

目標：

- 検索結果：3秒以内
- モーダル詳細：3秒以内
- 地図マーカー：3秒以内

必須：

- ローディング表示
- ページネーション
- N+1対策
- 最小DTO
- 必要なインデックス
- 無制限な全件取得禁止

### セキュリティ

- パスワードはハッシュ化。
- パスワードハッシュをAPIへ返さない。
- DBパスワード、JWT秘密鍵、APIキーをGitへ保存しない。
- XSS、CSRF、CORS対策。
- 権限はBackendで確認。
- 現在地を保存・ログ出力しない。

### ログ

記録可能：

- ユーザーID
- 聖地ID
- 承認・却下
- ロック・解除
- APIエラー
- 処理時間

記録禁止：

- パスワード
- JWT
- CSRFトークン
- DBパスワード
- 現在地
- 不要な個人情報

### アクセシビリティ

- キーボード操作
- フォーカス表示
- 適切な見出し
- `aria`属性
- 色以外の状態表現
- フォームエラー関連付け
- モーダルのフォーカス管理

---

## 21. テスト要件

### Backend

- Service単体テスト
- Repositoryテスト
- Controllerテスト
- Spring Securityテスト
- Flyway適用確認

重要項目：

- 未ログインで保護APIを実行できない
- USERが管理者APIを実行できない
- USERが他人の投稿を編集できない
- USER投稿が`PENDING`
- ADMIN投稿が`VERIFIED`
- `PENDING`と`REJECTED`が一般公開されない
- 却下理由なしで却下できない
- 重複いいね・お気に入りを登録できない
- 5回失敗でロック
- ADMINのみロック解除
- 詳細APIが不要な個人情報を返さない

### Frontend

- コンポーネントテスト
- フォームバリデーション
- APIエラー表示
- モーダル操作
- 位置情報拒否時
- レスポンシブ
- E2E

E2E対象：

- ユーザー登録
- ログイン
- 聖地投稿
- 管理者承認
- 公開地図反映
- いいね
- お気に入り
- ログアウト

---

## 22. 環境変数

### Frontend

```text
NEXT_PUBLIC_API_BASE_URL
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
NEXT_PUBLIC_GOOGLE_MAP_ID
```

`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`はブラウザへ公開されるため、Google Cloud側でHTTPリファラー制限とAPI制限を必須とする。

### Backend

```text
DATABASE_URL
DATABASE_USERNAME
DATABASE_PASSWORD
JWT_SECRET
FRONTEND_ORIGIN
COOKIE_SECURE
```

秘密情報をGitへコミットしない。

---

## 23. 開発順序

### Phase 1

- モノレポ
- Next.js
- Spring Boot
- PostgreSQL
- Docker Compose
- Flyway
- CORS・CSRF
- 共通エラー

### Phase 2

- users
- ユーザー登録
- ログイン
- JWT Cookie
- ログアウト
- `/auth/me`
- アカウントロック

### Phase 3

- sacred_spots
- 投稿
- 一覧
- 検索
- 詳細
- 編集・削除

### Phase 4

- Maps JavaScript APIの読み込み
- Map ID設定
- Advanced Markers
- 地図用API
- Geocoding API
- 住所検索
- ドラッグ可能な登録位置マーカー
- 詳細モーダル
- 現在地
- 距離表示
- Google Maps URLによる経路連携

### Phase 5

- 確認待ち一覧
- 承認
- 却下
- 信頼性ラベル
- マイページ状態表示

### Phase 6

- いいね
- お気に入り
- マイページ
- 絞り込み
- UI改善

### Phase 7

- テスト
- セキュリティ
- パフォーマンス
- レスポンシブ
- アクセシビリティ
- ドキュメント更新
---

## 24. 完成条件

- ユーザー登録
- ログイン・ログアウト
- USERとADMINの区別
- アカウントロック
- 聖地投稿
- 投稿承認・却下
- 一覧・検索
- 地図マーカー
- 詳細モーダル
- 現在地表示
- 直線距離表示
- Googleマップ連携
- いいね
- お気に入り
- マイページ
- 管理者画面
- スマートフォン対応
- 主要な自動テスト