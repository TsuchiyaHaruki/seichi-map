import type { Metadata } from "next";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const metadata: Metadata = {
  title: "管理者ダッシュボード | ノベルゲーム聖地巡礼マップ",
};

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <AdminGuard>
        <h1 className="text-2xl font-bold text-slate-900">
          管理者ダッシュボード
        </h1>
        <div className="mt-6">
          <AdminDashboard />
        </div>
      </AdminGuard>
    </div>
  );
}
