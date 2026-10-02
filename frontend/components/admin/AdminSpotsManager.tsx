"use client";

import { useCallback, useState } from "react";
import type { AdminSpotItem } from "@/types/admin";
import type { VerificationStatus } from "@/types/spot";
import { deleteSpotAsAdmin, fetchAdminSpots } from "@/lib/api/admin";
import {
  categoryLabel,
  DEFAULT_PAGE_SIZE,
  VERIFICATION_STATUS_LABELS,
} from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Pagination } from "@/components/ui/Pagination";
import { AdminSpotDetailModal } from "@/components/admin/AdminSpotDetailModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { formatDateTime, usePagedList } from "@/components/mypage/usePagedList";

const STATUS_VALUES: VerificationStatus[] = [
  "PENDING",
  "VERIFIED",
  "REJECTED",
];

export function AdminSpotsManager() {
  const [status, setStatus] = useState<VerificationStatus | "">("");

  const fetcher = useCallback(
    (page: number, signal: AbortSignal) =>
      fetchAdminSpots(
        {
          status: status === "" ? undefined : status,
          page,
          size: DEFAULT_PAGE_SIZE,
        },
        signal,
      ),
    [status],
  );
  const { items, page, totalPages, totalElements, loading, error, setPage, reload } =
    usePagedList<AdminSpotItem>(fetcher);

  const [detailId, setDetailId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminSpotItem | null>(null);

  const handleDelete = async (spot: AdminSpotItem) => {
    setActionError(null);
    setDeletingId(spot.id);
    try {
      await deleteSpotAsAdmin(spot.id);
      setDeleteTarget(null);
      reload();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "削除に失敗しました。");
      setDeleteTarget(null);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="max-w-xs">
        <Select
          label="状態で絞り込み"
          name="status"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as VerificationStatus | "");
            setPage(0);
          }}
        >
          <option value="">すべて</option>
          {STATUS_VALUES.map((value) => (
            <option key={value} value={value}>
              {VERIFICATION_STATUS_LABELS[value]}
            </option>
          ))}
        </Select>
      </div>

      <ErrorMessage message={actionError} />

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <ErrorMessage message={error} onRetry={reload} />
      ) : items.length === 0 ? (
        <EmptyState
          title="該当する聖地がありません"
          description="絞り込み条件を変更してください。"
        />
      ) : (
        <>
          <p className="text-sm text-slate-600">全{totalElements}件</p>
          <ul className="space-y-3">
            {items.map((spot) => (
              <li
                key={spot.id}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900">
                        {spot.spotName}
                      </span>
                      <StatusBadge status={spot.verificationStatus} />
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {spot.workName}・{categoryLabel(spot.category)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {spot.address}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      投稿者: {spot.registrantName} / 投稿:{" "}
                      {formatDateTime(spot.createdAt)} / 更新:{" "}
                      {formatDateTime(spot.updatedAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setDetailId(spot.id);
                        setDetailOpen(true);
                      }}
                    >
                      詳細を見る
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      loading={deletingId === spot.id}
                      onClick={() => setDeleteTarget(spot)}
                    >
                      削除
                    </Button>
                  </div>
                </div>
                {spot.verificationStatus === "REJECTED" &&
                  spot.rejectionReason && (
                    <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      <span className="font-semibold">却下理由: </span>
                      {spot.rejectionReason}
                    </div>
                  )}
              </li>
            ))}
          </ul>
          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              disabled={loading}
            />
          )}
        </>
      )}
      <AdminSpotDetailModal
        spotId={detailId}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
      <ConfirmModal
        open={deleteTarget !== null}
        title="聖地を削除"
        description={
          deleteTarget
            ? `「${deleteTarget.spotName}」(${deleteTarget.workName})を削除します。投稿画像もまとめて消え、この操作は取り消せません。`
            : undefined
        }
        confirmLabel="削除する"
        confirmVariant="danger"
        loading={deleteTarget !== null && deletingId === deleteTarget.id}
        onConfirm={() => {
          if (deleteTarget) {
            void handleDelete(deleteTarget);
          }
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
