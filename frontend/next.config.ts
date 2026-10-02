import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 開発中に左下へ出るNext.jsのインジケーターを非表示にする(本番ビルドには元から出ない)
  devIndicators: false,
};

export default nextConfig;
