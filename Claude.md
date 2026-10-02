# CLAUDE.md

このプロジェクトでClaude Codeが作業する際の入口となる指示です。

詳細な機能仕様は`AI_SPECIFICATION.md`、共通の開発ルールは`AGENTS.md`を参照してください。

## 1. 作業前に読むファイル

以下の順番で確認してください。

1. `AI_SPECIFICATION.md`
2. `AGENTS.md`
3. `README.md`
4. 関連するFrontendコード
5. 関連するBackendコード
6. 関連するテスト
7. Flywayマイグレーション
8. `frontend/package.json`
9. `backend/pom.xml`

## 2. プロジェクト構成

```text
Frontend
- Next.js
- App Router
- TypeScript
- Tailwind CSS
- Google Maps JavaScript API
- Advanced Markers
- Geocoding API

Backend
- Java
- Spring Boot
- Spring Security
- Spring Data JPA
- Flyway

Database
- PostgreSQL
```

Frontendは画面、Tailwind CSS、地図、モーダル、フォーム、API呼び出しを担当します。

Backendは認証、JWT、権限、業務ロジック、バリデーション、DB操作、投稿承認を担当します。

## 3. 作業手順

1. 関連仕様を確認する
2. 既存実装を調査する
3. 影響範囲を整理する
4. 日本語で実装プランを提示する
5. 原則としてユーザーの承認を得る
6. 最小限の差分で実装する
7. テストとビルドを実行する
8. 日本語で結果を報告する

ユーザーが「実装して」「修正して」「作成して」など、明示的に作業開始を指示した場合は、その指示を承認として扱って構いません。

## 4. 実装プランに含める内容

```text
目的
- 何を実現するか

変更予定
- Frontendの変更ファイル
- Backendの変更ファイル
- DBマイグレーション
- 設定ファイル

設計上の確認
- 認証への影響
- 権限への影響
- APIへの影響
- 既存機能への影響

確認方法
- Frontendテスト
- Backendテスト
- ビルド
- 手動確認
```

## 5. 最重要ルール

- `AI_SPECIFICATION.md`にない機能を勝手に追加しないでください。
- `AGENTS.md`の禁止事項を守ってください。
- 技術スタックを変更しないでください。
- Next.js側の表示だけで権限管理を完結させないでください。
- 権限の最終判定はSpring Bootで行ってください。
- EntityをAPIレスポンスとして直接返さないでください。
- JWT、DBパスワード、APIキーをコードへ書かないでください。
- DB変更はFlywayで管理してください。
- 適用済みマイグレーションを編集しないでください。
- 利用者の現在地をDBやログへ保存しないでください。
- Google Maps Platformのロゴ、著作権、利用規約表示を隠さないでください。
- `DEMO_MAP_ID`は動作確認だけに使用し、本番環境では専用Map IDを使用してください。
- 既存の未コミット変更を勝手に削除しないでください。
- 大規模な全面書き換えを避けてください。
- 実行していないテストを成功と報告しないでください。

## 6. Frontend実装時

- TypeScriptの型を定義してください。
- `any`を安易に使用しないでください。
- Server Componentを基本にしてください。
- Googleマップ、Advanced Markers、Geocoding、モーダル、位置情報など必要な箇所だけClient Componentにしてください。
- Maps JavaScript APIは必要なライブラリだけを動的に読み込んでください。
- `maps`、`marker`、`geocoding`ライブラリを用途に応じて使用してください。
- Advanced Markersでは環境変数のMap IDを使用してください。
- Geocoding結果はGoogleマップ上で確認させ、登録前に利用者がマーカー位置を調整できるようにしてください。
- Google Maps APIキーをコードへ直接記述しないでください。
- ブラウザ用APIキーは公開される前提で、Google Cloud側のHTTPリファラー制限とAPI制限を必須としてください。
- Tailwind CSSを使用してください。
- API通信を`lib/api`へ共通化してください。
- `credentials: "include"`を設定してください。
- 状態変更APIではCSRFトークンを送信してください。
- ローディング、空状態、エラー状態を実装してください。
- レスポンシブとキーボード操作を確認してください。

## 7. Backend実装時

- Controller、Service、Repositoryの責務を分けてください。
- Request DTOとResponse DTOを分けてください。
- Bean Validationを使用してください。
- Serviceで権限、所有者、確認状態を検証してください。
- 更新処理に`@Transactional`を使用してください。
- Spring SecurityでAPIを保護してください。
- エラー形式を`@RestControllerAdvice`で統一してください。
- FlywayとDB制約を更新してください。
- APIレスポンスへ不要な個人情報を含めないでください。

## 8. テスト

Backend：

```bash
./mvnw test
./mvnw clean verify
```

Frontend：

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

実際に存在するスクリプトを確認してから実行してください。

テストを実行できない場合は、理由と未確認範囲を報告してください。

## 9. 作業完了報告

```text
実装内容
- 実装・修正した内容

変更ファイル
- Frontend
- Backend
- DB
- 設定・文書

確認内容
- Frontendテスト
- Backendテスト
- ビルド
- 手動確認

未確認・注意点
- 実行できなかった確認
- 残っている課題
- 今後必要な作業
```