"use client";

import { useCallback, useState } from "react";
import type { AdminUserItem } from "@/types/admin";
import {
  fetchAdminUsers,
  unlockUser,
  updateUserEnabled,
} from "@/lib/api/admin";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { formatDateTime, usePagedList } from "@/components/mypage/usePagedList";

export function AdminUsersManager() {
  const { user: currentUser } = useAuth();
  const fetcher = useCallback(
    (page: number, signal: AbortSignal) =>
      fetchAdminUsers(page, DEFAULT_PAGE_SIZE, signal),
    [],
  );
  const { items, page, totalPages, totalElements, loading, error, setPage, reload } =
    usePagedList<AdminUserItem>(fetcher);

  const [actionError, setActionError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [unlockTarget, setUnlockTarget] = useState<AdminUserItem | null>(null);
  const [enabledTarget, setEnabledTarget] = useState<AdminUserItem | null>(null);

  const handleUnlock = async (target: AdminUserItem) => {
    setActionError(null);
    setProcessingId(target.id);
    try {
      await unlockUser(target.id);
      reload();
    } catch (e: unknown) {
      setActionError(
        e instanceof Error ? e.message : "ロック解除に失敗しました。",
      );
    } finally {
      setUnlockTarget(null);
      setProcessingId(null);
    }
  };

  const handleToggleEnabled = async (target: AdminUserItem) => {
    setActionError(null);
    setProcessingId(target.id);
    try {
      await updateUserEnabled(target.id, !target.enabled);
      reload();
    } catch (e: unknown) {
      setActionError(
        e instanceof Error ? e.message : "状態の変更に失敗しました。",
      );
    } finally {
      setEnabledTarget(null);
      setProcessingId(null);
    }
  };

  /** 有効化・無効化の確認文言(自分自身を無効化する場合はより強く注意する) */
  const enabledConfirmDescription = (target: AdminUserItem): string => {
    if (!target.enabled) {
      return `「${target.userName}」を有効化します。再びログインできるようになります。`;
    }
    if (currentUser?.id === target.id) {
      return "自分自身のアカウントを無効化しようとしています。実行するとログインできなくなります。";
    }
    return `「${target.userName}」を無効化します。無効化するとログインできなくなります。`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={reload} />;
  }

  if (items.length === 0) {
    return <EmptyState title="ユーザーがいません" />;
  }

  return (
    <div className="space-y-4">
      <ErrorMessage message={actionError} />
      <p className="text-sm text-slate-600">全{totalElements}件</p>
      <ul className="space-y-3">
        {items.map((item) => {
          const isSelf = currentUser?.id === item.id;
          return (
            <li
              key={item.id}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900">
                      {item.userName}
                    </span>
                    {isSelf && (
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                        自分
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        item.role === "ADMIN"
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.role === "ADMIN" ? "管理者" : "一般ユーザー"}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        item.enabled
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {item.enabled ? "有効" : "無効"}
                    </span>
                    {item.locked && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        ロック中
                      </span>
                    )}
                  </div>
                  <p className="mt-1 break-all text-sm text-slate-600">
                    {item.email}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    ログイン失敗回数: {item.failedAttempts}回
                    {item.lockedAt &&
                      ` / ロック日時: ${formatDateTime(item.lockedAt)}`}
                    {` / 登録: ${formatDateTime(item.createdAt)}`}
                  </p>
                  {isSelf && (
                    <p className="mt-1 text-xs text-red-600">
                      注意: 自分自身を無効化するとログインできなくなります。
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {item.locked && (
                    <Button
                      variant="primary"
                      size="sm"
                      loading={processingId === item.id}
                      onClick={() => setUnlockTarget(item)}
                    >
                      ロック解除
                    </Button>
                  )}
                  <Button
                    variant={item.enabled ? "danger" : "secondary"}
                    size="sm"
                    loading={processingId === item.id}
                    onClick={() => setEnabledTarget(item)}
                  >
                    {item.enabled ? "無効化する" : "有効化する"}
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          disabled={loading}
        />
      )}
      <ConfirmModal
        open={unlockTarget !== null}
        title="ロックを解除"
        description={
          unlockTarget
            ? `「${unlockTarget.userName}」のロックを解除します。再びログインできるようになります。`
            : undefined
        }
        confirmLabel="解除する"
        loading={unlockTarget !== null && processingId === unlockTarget.id}
        onConfirm={() => {
          if (unlockTarget) {
            void handleUnlock(unlockTarget);
          }
        }}
        onClose={() => setUnlockTarget(null)}
      />
      <ConfirmModal
        open={enabledTarget !== null}
        title={enabledTarget?.enabled ? "アカウントを無効化" : "アカウントを有効化"}
        description={
          enabledTarget ? enabledConfirmDescription(enabledTarget) : undefined
        }
        confirmLabel={enabledTarget?.enabled ? "無効化する" : "有効化する"}
        confirmVariant={enabledTarget?.enabled ? "danger" : "primary"}
        loading={enabledTarget !== null && processingId === enabledTarget.id}
        onConfirm={() => {
          if (enabledTarget) {
            void handleToggleEnabled(enabledTarget);
          }
        }}
        onClose={() => setEnabledTarget(null)}
      />
    </div>
  );
}
