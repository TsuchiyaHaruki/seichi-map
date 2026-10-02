# 本番デプロイ手順（Oracle Cloud Always Free）

Oracle Cloud の Always Free 枠の VM 1台に、Docker Compose で全サービスを載せて公開する手順。

## 構成

```text
ブラウザ ──https──> Caddy (80/443, Let's Encrypt 証明書を自動取得・更新)
                      ├─ /api/*  → backend:8080 (Spring Boot)
                      └─ それ以外 → frontend:3000 (Next.js)
                    backend ──> db (PostgreSQL 16)
```

- 外部へ公開するのは Caddy の 80/443 だけ。backend と db のポートは公開しない。
- 画面と API が同一オリジンになるため、`access_token` Cookie は Frontend 側にも送られる（`middleware.ts` の画面遷移補助が動作する前提）。
- データは Docker ボリュームに保存する。

| ボリューム | 内容 |
|---|---|
| `seichi-prod_db-data` | PostgreSQL のデータ |
| `seichi-prod_spot-images` | 投稿画像（`SPOT_IMAGE_DIR=/data/spot-images`） |
| `seichi-prod_caddy-data` | HTTPS 証明書 |

関連ファイル：

| ファイル | 役割 |
|---|---|
| `compose.prod.yml` | 本番用の構成 |
| `deploy/Caddyfile` | リバースプロキシと HTTPS |
| `backend/Dockerfile` / `frontend/Dockerfile` | 各アプリのイメージ |
| `.env.prod.example` | 本番用の環境変数のひな形 |

---

## 1. 事前準備（ローカル）

デプロイする前に、ローカルでテストとビルドが通ることを確認する。Docker イメージのビルドではテストを実行しない。

```bash
docker compose up -d db
cd backend && ./mvnw clean verify
cd ../frontend && npm run lint && npm run typecheck && npm run test && npm run build
```

確認できたら GitHub へ push する。

## 2. ドメイン（DuckDNS）

1. https://www.duckdns.org に GitHub アカウントなどでログインする。
2. サブドメイン（例：`seichi-map`）を作成する。`seichi-map.duckdns.org` が使えるようになる。
3. IP アドレスは、手順 3 で VM を作成したあとに設定する。

独自ドメインを使う場合は、DNS に A レコードを登録する。

## 3. VM の作成（Oracle Cloud）

1. Oracle Cloud に登録する。
   - クレジットカードによる本人確認が必要。Always Free の範囲内なら課金されない。
   - ホームリージョンはあとから変更できない。日本なら Tokyo か Osaka を選ぶ。
2. 「コンピュート → インスタンス → インスタンスの作成」を開く。
   - イメージ：**Ubuntu 24.04**
   - シェイプ：**VM.Standard.A1.Flex**（Ampere ARM）、例として 2 OCPU / 12GB メモリ。Always Free の上限は合計 4 OCPU / 24GB。
   - SSH キー：自分の公開鍵を登録する。
   - 「Out of capacity」と表示された場合は、別の可用性ドメインを選ぶか、時間をおいて再試行する。
3. 作成されたインスタンスのパブリック IP を、DuckDNS のサブドメインに設定する。

> 利用率の低い Always Free インスタンスは、Oracle に回収される場合がある。最新の条件は Oracle の公式ドキュメントで確認する。

## 4. ポートの開放（2か所とも必要）

### 4-1. VCN のセキュリティリスト

「インスタンス詳細 → サブネット → セキュリティリスト → イングレスルールの追加」で、次を追加する。

| ソース CIDR | プロトコル | 宛先ポート |
|---|---|---|
| 0.0.0.0/0 | TCP | 80 |
| 0.0.0.0/0 | TCP | 443 |
| 0.0.0.0/0 | UDP | 443 |

### 4-2. OS のファイアウォール（iptables）

Oracle の Ubuntu イメージは、初期状態で iptables が 22 番以外をすべて拒否する。

```bash
ssh ubuntu@<パブリックIP>

sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p udp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

## 5. Docker のインストール

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
exit   # 再ログインしてグループを反映する
```

再ログインしたら、次で確認する。

```bash
docker compose version
```

## 6. アプリの配置と環境変数

```bash
git clone https://github.com/<ユーザー名>/<リポジトリ>.git seichi
cd seichi
cp .env.prod.example .env.prod
chmod 600 .env.prod
nano .env.prod
```

| 変数 | 設定する値 |
|---|---|
| `DOMAIN` | 例：`seichi-map.duckdns.org` |
| `POSTGRES_PASSWORD` | `openssl rand -base64 32` で生成した値 |
| `JWT_SECRET` | `openssl rand -base64 64` で生成した値。開発用の値は使い回さない |
| `ADMIN_USER_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | 初期管理者。強いパスワードにする |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | 本番用の API キー（手順 9 を参照） |
| `NEXT_PUBLIC_GOOGLE_MAP_ID` | 本番用の専用 Map ID。`DEMO_MAP_ID` は使わない |

`.env.prod` は Git にコミットしない（`.gitignore` 済み）。

## 7. 起動

```bash
docker compose --env-file .env.prod -f compose.prod.yml up -d --build
docker compose -p seichi-prod ps
docker compose -p seichi-prod logs -f backend   # "Started SeichiBackendApplication" が出れば起動完了
```

- 初回のビルドには数分かかる。
- 起動時に Flyway のマイグレーションが自動で適用される。
- `https://<DOMAIN>` を開き、次を確認する。
  - 鍵マークが付いている（HTTPS になっている）
  - ログインできる
  - マイページを開ける
  - 聖地を投稿でき、画像をアップロードできる

### 初期管理者を作成したあと

`.env.prod` の `ADMIN_USER_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` を空にして、Backend を作り直す。

```bash
docker compose --env-file .env.prod -f compose.prod.yml up -d backend
```

## 8. 更新（再デプロイ）

```bash
cd ~/seichi
git pull
docker compose --env-file .env.prod -f compose.prod.yml up -d --build
docker image prune -f
```

DB と画像はボリュームに残る。DB の変更は、新しい Flyway マイグレーションとして起動時に適用される。

## 9. Google Cloud の設定（公開前に必須）

本番用の API キーを、開発用とは別に作成する。

| 項目 | 設定 |
|---|---|
| アプリケーションの制限 | HTTP リファラー：`https://<DOMAIN>/*` |
| API の制限 | Maps JavaScript API と Geocoding API のみ |
| 割り当て（Quotas） | Maps JavaScript API と Geocoding API の 1 日あたりのリクエスト上限を低めに設定する |
| 予算アラート | 「お支払い → 予算とアラート」で少額の予算とアラートを設定する |
| Map ID | 「Google Maps Platform → マップ管理」で JavaScript 用の Map ID を作成する |

`NEXT_PUBLIC_*` はビルド時に埋め込まれる。キーや Map ID を変えたら、手順 8 で再ビルドする。

## 10. バックアップ

DB のダンプを取る。

```bash
mkdir -p ~/backups
docker compose -p seichi-prod exec -T db pg_dump -U seichi seichi | gzip > ~/backups/db-$(date +%F).sql.gz
```

投稿画像をアーカイブする。

```bash
docker run --rm -v seichi-prod_spot-images:/data -v ~/backups:/backup alpine \
  tar czf /backup/images-$(date +%F).tar.gz -C /data .
```

- 定期的に取る場合は `crontab -e` で登録する。
- バックアップは VM の外（手元の PC など）にもコピーしておく。

リストア（DB）：

```bash
gunzip -c ~/backups/db-YYYY-MM-DD.sql.gz | docker compose -p seichi-prod exec -T db psql -U seichi seichi
```

## トラブルシューティング

| 症状 | 確認すること |
|---|---|
| HTTPS 証明書が取得できない | `docker compose -p seichi-prod logs caddy` を見る。DuckDNS の IP が VM と一致しているか、80/443 が手順 4 の 2 か所とも開いているか |
| 地図だけ表示されない | API キーのリファラー制限に本番ドメインが入っているか。ブラウザの開発者ツールのコンソールを確認する |
| ログインしても保護ページでログイン画面に戻る | `https://<DOMAIN>` でアクセスしているか（HTTP や IP 直打ちでは Secure Cookie が送られない） |
| 状態変更 API が 403 | `FRONTEND_ORIGIN`（= `https://<DOMAIN>`）とアクセスしている URL が一致しているか |
| Backend が起動しない | `logs backend` を見る。`JWT_SECRET` が短すぎないか（HS256 には 32 バイト以上が必要） |
