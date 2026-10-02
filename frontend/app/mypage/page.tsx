import type { Metadata } from "next";
import { MyPageTabs } from "@/components/mypage/MyPageTabs";

export const metadata: Metadata = {
  title: "マイページ | ノベルゲーム聖地巡礼マップ",
};

export default function MyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-2xl font-bold text-slate-900">マイページ</h1>
      <div className="mt-6">
        <MyPageTabs />
      </div>
    </div>
  );
}
