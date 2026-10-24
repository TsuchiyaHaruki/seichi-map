import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 開発中に左下へ出るNext.jsのインジケーターを非表示にする(本番ビルドには元から出ない)
  devIndicators: false,
  // 本番のDockerイメージ用に、実行に必要なファイルだけを .next/standalone へ出力する
  output: "standalone",
  // X-Powered-By: Next.js を出さない(使用技術を不必要に公開しない)
  poweredByHeader: false,
};

export default nextConfig;
