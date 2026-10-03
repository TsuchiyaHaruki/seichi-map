# ノベルゲーム聖地巡礼マップ

ノベルゲームおよびノベルゲーム原作アニメの聖地を、地図上で検索・閲覧・投稿できるWebアプリケーション。
一般利用者の投稿は管理者の承認後に公開され、管理者登録・管理者確認済みの区別(信頼性ラベル)付きで表示される。

仕様は [AI_SPECIFICATION.md](./AI_SPECIFICATION.md)、開発ルールは [../AGENTS.md](../AGENTS.md) を参照。

## 技術スタック

| 層 | 技術 |
|---|---|
| Frontend | Next.js (App Router) / TypeScript / Tailwind CSS / Google Maps JavaScript API (Advanced Markers, Geocoding) |
| Backend | Java 21 / Spring Boot / Spring Security (JWT + HttpOnly Cookie + CSRF) / Spring Data JPA / Flyway |
| Database | PostgreSQL |

## ディレクトリ構成

```text
seichi/
├── frontend/   Next.js アプリ
├── backend/    Spring Boot アプリ
├── docs/       ドキュメント
├── deploy/     本番用リバースプロキシ設定 (Caddyfile)
├── compose.yml      PostgreSQL (開発用)
├── compose.prod.yml 本番用構成 (db / backend / frontend / caddy)
└── AI_SPECIFICATION.md
```

## セットアップ

### 1. 環境変数

```bash
cp .env.example .env                              # ルート(DB・Backend用)
cp frontend/.env.local.example frontend/.env.local # Frontend用
```

- `JWT_SECRET` は `openssl rand -base64 64` などで生成して設定する(必須。未設定だとBackendは起動しない)。
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` はGoogle Cloudで **Maps JavaScript API / Geocoding API のみ許可** + **HTTPリファラー制限** を設定したブラウザ用キーを使用する。
- `NEXT_PUBLIC_GOOGLE_MAP_ID` はローカル確認では `DEMO_MAP_ID` を使用可。**本番では専用Map IDを使用する。**
- 初期管理者を作るには `ADMIN_USER_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` を設定してBackendを起動する(起動時に未登録なら作成される)。
- 聖地の投稿画像は `SPOT_IMAGE_DIR` のフォルダへ保存する(未設定なら `backend/var/spot-images`)。Gitへはコミットしない。

秘密情報(`.env` / `.env.local`)はGitへコミットしない。

### 2. データベース起動

```bash
docker compose up -d db
```

### 3. Backend起動(ポート8080)

```bash
cd backend
set -a; source ../.env; set +a   # 環境変数を読み込む
./mvnw spring-boot:run
```

Flywayマイグレーションは起動時に自動適用される。

### 4. Frontend起動(ポート3000)

```bash
cd frontend
npm install
npm run dev
```

http://localhost:3000 を開く。

## テスト

```bash
# Backend(統合テストは稼働中のcompose PostgreSQL上の専用DB seichi_test を使うため、先にDBを起動する)
docker compose up -d db
cd backend && ./mvnw test

# Frontend
cd frontend && npm run lint && npm run typecheck && npm run test && npm run build
```

## 補足

- 認証: JWTはSpring Bootが発行し `access_token` HttpOnly Cookie(SameSite=Lax、30分、残り15分未満でスライディング更新)に保存。状態変更APIは `X-XSRF-TOKEN` ヘッダーによるCSRF対策必須。
- 本番では `COOKIE_SECURE=true` とし、FrontendとBackendを同一オリジンで配信する(Caddyが `/api/*` をBackendへ転送し、Frontendは `NEXT_PUBLIC_API_BASE_URL` を空文字でビルドする)。

## 本番デプロイ

Oracle Cloud Always Free のVM 1台へ Docker Compose でデプロイする。手順は [docs/deploy-oracle.md](./docs/deploy-oracle.md) を参照。

```bash
cp .env.prod.example .env.prod   # 値を設定する(Gitへコミットしない)
docker compose --env-file .env.prod -f compose.prod.yml up -d --build
```
- 地図用API(`GET /api/v1/sacred-spots/map`)は負荷対策として最大500件を返す。
- 現在地はブラウザ内でのみ使用し、サーバーへ送信・保存しない。
