"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchAdminSpots } from "@/lib/api/admin";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";

interface StatusCounts {
  pending: number;
  verified: number;
  rejected: number;
}

const NAV_LINKS = [
  {
    href: "/admin/spots/pending",
    label: "確認待ち一覧",
    description: "投稿の承認・却下を行います",
  },
  {
    href: "/admin/spots",
    label: "聖地管理",
    description: "状態で絞り込み、投稿を管理します",
  },
  {
    href: "/admin/users",
    label: "ユーザー管理",
    description: "ロック解除・有効/無効を切り替えます",
  },
];

export function AdminDashboard() {
  const [counts, setCounts] = useState<StatusCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    Promise.all([
      fetchAdminSpots({ status: "PENDING", size: 1 }, controller.signal),
      fetchAdminSpots({ status: "VERIFIED", size: 1 }, controller.signal),
      fetchAdminSpots({ status: "REJECTED", size: 1 }, controller.signal),
    ])
      .then(([pending, verified, rejected]) => {
        if (controller.signal.aborted) {
          return;
        }
        setCounts({
          pending: pending.totalElements,
          verified: verified.totalElements,
          rejected: rejected.totalElements,
        });
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setError(
          e instanceof Error ? e.message : "件数の取得に失敗しました。",
        );
        setLoading(false);
      });
    return () => controller.abort();
  }, [reloadKey]);

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <ErrorMessage
          message={error}
          onRetry={() => setReloadKey((key) => key + 1)}
        />
      ) : (
        counts && (
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <dt className="text-sm font-medium text-yellow-800">確認待ち</dt>
              <dd className="mt-1 text-3xl font-bold text-yellow-900">
                {counts.pending}
                <span className="ml-1 text-sm font-normal">件</span>
              </dd>
            </div>
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <dt className="text-sm font-medium text-green-800">承認済み</dt>
              <dd className="mt-1 text-3xl font-bold text-green-900">
                {counts.verified}
                <span className="ml-1 text-sm font-normal">件</span>
              </dd>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <dt className="text-sm font-medium text-red-800">却下</dt>
              <dd className="mt-1 text-3xl font-bold text-red-900">
                {counts.rejected}
                <span className="ml-1 text-sm font-normal">件</span>
              </dd>
            </div>
          </dl>
        )
      )}

      <nav aria-label="管理メニュー">
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="block min-h-11 rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                <span className="font-semibold text-indigo-600">
                  {link.label}
                </span>
                <span className="mt-1 block text-sm text-slate-600">
                  {link.description}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
