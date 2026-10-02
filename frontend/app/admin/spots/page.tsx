import type { Metadata } from "next";
import Link from "next/link";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminSpotsManager } from "@/components/admin/AdminSpotsManager";

export const metadata: Metadata = {
  title: "聖地管理 | ノベルゲーム聖地巡礼マップ",
};

export default function AdminSpotsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <AdminGuard>
        <Link
          href="/admin"
          className="text-sm text-indigo-600 hover:text-indigo-700"
        >
          ← 管理者ダッシュボード
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">聖地管理</h1>
        <div className="mt-6">
          <AdminSpotsManager />
        </div>
      </AdminGuard>
    </div>
  );
}
