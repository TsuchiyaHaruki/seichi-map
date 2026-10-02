"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import type { MyPostItem } from "@/types/spot";
import { fetchMyPosts } from "@/lib/api/users";
import { deleteSpot } from "@/lib/api/spots";
import { categoryLabel, DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Pagination } from "@/components/ui/Pagination";
import { SpotDetailModal } from "@/components/modal/SpotDetailModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { formatDateTime, usePagedList } from "@/components/mypage/usePagedList";

export function MyPostsList() {
  const fetcher = useCallback(
    (page: number, signal: AbortSignal) =>
      fetchMyPosts(page, DEFAULT_PAGE_SIZE, signal),
    [],
  );
  const { items, page, totalPages, loading, error, setPage, reload } =
    usePagedList<MyPostItem>(fetcher);

  const [selectedSpotId, setSelectedSpotId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MyPostItem | null>(null);

  const openDetail = (id: number) => {
    setSelectedSpotId(id);
    setModalOpen(true);
  };

  const handleDelete = async (post: MyPostItem) => {
    setActionError(null);
    setDeletingId(post.id);
    try {
      await deleteSpot(post.id);
      reload();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "削除に失敗しました。");
    } finally {
      setDeleteTarget(null);
      setDeletingId(null);
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

  if (items.length === 0) {
    return (
      <EmptyState
        title="投稿がありません"
        description="聖地を投稿すると、ここで状態を確認できます。"
      />
    );
  }

  return (
    <div className="space-y-4">
      <ErrorMessage message={actionError} />
      <ul className="space-y-3">
        {items.map((post) => (
          <li
            key={post.id}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <button
                type="button"
                onClick={() => openDetail(post.id)}
                className="min-h-11 flex-1 rounded-md text-left focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-900">
                    {post.spotName}
                  </span>
                  <StatusBadge status={post.verificationStatus} />
                </span>
                <span className="mt-1 block text-sm text-slate-600">
                  {post.workName}・{categoryLabel(post.category)}
                </span>
                <span className="mt-1 block text-sm text-slate-500">
                  {post.address}
                </span>
                <span className="mt-1 block text-xs text-slate-400">
                  いいね {post.likeCount}件 / 投稿:{" "}
                  {formatDateTime(post.createdAt)} / 更新:{" "}
                  {formatDateTime(post.updatedAt)}
                </span>
              </button>
              <div className="flex shrink-0 items-start gap-2">
                <Link
                  href={`/spots/${post.id}/edit`}
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                >
                  編集
                </Link>
                {(post.verificationStatus === "PENDING" ||
                  post.verificationStatus === "REJECTED") && (
                  <Button
                    variant="danger"
                    loading={deletingId === post.id}
                    onClick={() => setDeleteTarget(post)}
                  >
                    削除
                  </Button>
                )}
              </div>
            </div>
            {post.verificationStatus === "REJECTED" &&
              post.rejectionReason && (
                <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <span className="font-semibold">却下理由: </span>
                  {post.rejectionReason}
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
      <SpotDetailModal
        spotId={selectedSpotId}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onChanged={reload}
      />
      <ConfirmModal
        open={deleteTarget !== null}
        title="投稿を削除"
        description={
          deleteTarget
            ? `「${deleteTarget.spotName}」を削除します。投稿画像もまとめて消え、この操作は取り消せません。`
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
