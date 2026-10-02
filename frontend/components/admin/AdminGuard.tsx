"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { Spinner } from "@/components/ui/Spinner";

/**
 * 管理者画面の表示制御。表示のみの補助であり、
 * 権限の最終判定はBackend APIの403で行われる。
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <h1 className="text-xl font-bold text-slate-900">権限がありません</h1>
        <p className="mt-2 text-sm text-slate-600">
          このページは管理者のみ利用できます。
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex min-h-11 items-center rounded-md bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          トップへ戻る
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
