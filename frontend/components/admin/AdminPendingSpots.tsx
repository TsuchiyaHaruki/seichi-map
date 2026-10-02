"use client";

import { useCallback, useState } from "react";
import type { AdminSpotItem } from "@/types/admin";
import {
  fetchPendingSpots,
  rejectSpot,
  verifySpot,
} from "@/lib/api/admin";
import { validateRejectionReason } from "@/lib/validation";
import { categoryLabel, DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { TextArea } from "@/components/ui/TextArea";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { AdminSpotDetailModal } from "@/components/admin/AdminSpotDetailModal";
import { formatDateTime, usePagedList } from "@/components/mypage/usePagedList";

interface RejectModalProps {
  spot: AdminSpotItem;
  onClose: () => void;
  onRejected: () => void;
}

function RejectModal({ spot, onClose, onRejected }: RejectModalProps) {
  const [reason, setReason] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const validationError = validateRejectionReason(reason);
    if (validationError) {
      setFieldError(validationError);
      return;
    }
    setFieldError(null);
    setApiError(null);
    setSubmitting(true);
    try {
      await rejectSpot(spot.id, reason.trim());
      onRejected();
    } catch (e: unknown) {
      setApiError(e instanceof Error ? e.message : "却下に失敗しました。");
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      titleId="reject-spot-title"
      widthClassName="max-w-lg"
    >
      <h2 id="reject-spot-title" className="text-lg font-bold text-slate-900">
        投稿を却下
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        「{spot.spotName}」({spot.workName})を却下します。理由は投稿者に表示されます。
      </p>
      <div className="mt-4">
        <ErrorMessage message={apiError} />
        <TextArea
          label="却下理由(必須・500文字以内)"
          name="reason"
          rows={4}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          error={fieldError ?? undefined}
        />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={submitting}>
          キャンセル
        </Button>
        <Button variant="danger" loading={submitting} onClick={handleSubmit}>
          却下する
        </Button>
      </div>
    </Modal>
  );
}

export function AdminPendingSpots() {
  const fetcher = useCallback(
    (page: number, signal: AbortSignal) =>
      fetchPendingSpots(page, DEFAULT_PAGE_SIZE, signal),
    [],
  );
  const { items, page, totalPages, totalElements, loading, error, setPage, reload } =
    usePagedList<AdminSpotItem>(fetcher);

  const [detailId, setDetailId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<AdminSpotItem | null>(null);
  const [verifyTarget, setVerifyTarget] = useState<AdminSpotItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);

  const handleVerify = async (spot: AdminSpotItem) => {
    setActionError(null);
    setVerifyingId(spot.id);
    try {
      await verifySpot(spot.id);
      setVerifyTarget(null);
      reload();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "承認に失敗しました。");
      setVerifyTarget(null);
    } finally {
      setVerifyingId(null);
    }
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

  return (
    <div className="space-y-4">
      <ErrorMessage message={actionError} />
      {items.length === 0 ? (
        <EmptyState
          title="確認待ちの投稿はありません"
          description="新しい投稿が届くとここに表示されます。"
        />
      ) : (
        <>
          <p className="text-sm text-slate-600">
            確認待ち: {totalElements}件(投稿日時の古い順)
          </p>
          <ul className="space-y-3">
            {items.map((spot) => (
              <li
                key={spot.id}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">
                      {spot.spotName}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {spot.workName}・{categoryLabel(spot.category)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {spot.address}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      投稿者: {spot.registrantName} / 投稿:{" "}
                      {formatDateTime(spot.createdAt)}
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
                      variant="primary"
                      size="sm"
                      loading={verifyingId === spot.id}
                      onClick={() => setVerifyTarget(spot)}
                    >
                      承認
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setRejectTarget(spot)}
                    >
                      却下
                    </Button>
                  </div>
                </div>
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
      {rejectTarget && (
        <RejectModal
          spot={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onRejected={() => {
            setRejectTarget(null);
            reload();
          }}
        />
      )}
      <ConfirmModal
        open={verifyTarget !== null}
        title="投稿を承認"
        description={
          verifyTarget
            ? `「${verifyTarget.spotName}」(${verifyTarget.workName})を承認します。承認すると一般公開されます。`
            : undefined
        }
        confirmLabel="承認する"
        loading={verifyTarget !== null && verifyingId === verifyTarget.id}
        onConfirm={() => {
          if (verifyTarget) {
            void handleVerify(verifyTarget);
          }
        }}
        onClose={() => setVerifyTarget(null)}
      />
    </div>
  );
}
