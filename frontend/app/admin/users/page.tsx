import type { Metadata } from "next";
import Link from "next/link";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminUsersManager } from "@/components/admin/AdminUsersManager";

export const metadata: Metadata = {
  title: "ユーザー管理 | ノベルゲーム聖地巡礼マップ",
};

export default function AdminUsersPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <AdminGuard>
        <Link
          href="/admin"
          className="text-sm text-indigo-600 hover:text-indigo-700"
        >
          ← 管理者ダッシュボード
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          ユーザー管理
        </h1>
        <div className="mt-6">
          <AdminUsersManager />
        </div>
      </AdminGuard>
    </div>
  );
}
