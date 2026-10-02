"use client";

import { useState } from "react";
import type { PageResponse } from "@/types/api";
import type { SpotListItem } from "@/types/spot";
import { categoryLabel } from "@/lib/constants";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { EmptyState } from "@/components/ui/EmptyState";
import { TrustBadge } from "@/components/ui/TrustBadge";
import { Pagination } from "@/components/ui/Pagination";
import { SpotDetailModal } from "@/components/modal/SpotDetailModal";
import { usePagedList } from "@/components/mypage/usePagedList";

interface MySpotListProps {
  /** useCallbackで安定化したfetcherを渡すこと */
  fetcher: (
    page: number,
    signal: AbortSignal,
  ) => Promise<PageResponse<SpotListItem>>;
  emptyTitle: string;
  emptyDescription?: string;
}

/** いいね・お気に入り共通の聖地一覧(行クリックで共通詳細モーダル) */
export function MySpotList({
  fetcher,
  emptyTitle,
  emptyDescription,
}: MySpotListProps) {
  const { items, page, totalPages, loading, error, setPage, reload } =
    usePagedList<SpotListItem>(fetcher);

  const [selectedSpotId, setSelectedSpotId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

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
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {items.map((spot) => (
          <li key={spot.id}>
            <button
              type="button"
              onClick={() => {
                setSelectedSpotId(spot.id);
                setModalOpen(true);
              }}
              className="min-h-11 w-full rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-900">
                  {spot.spotName}
                </span>
                <TrustBadge label={spot.trustLabel} />
              </span>
              <span className="mt-1 block text-sm text-slate-600">
                {spot.workName}・{categoryLabel(spot.category)}
              </span>
              <span className="mt-1 block text-sm text-slate-500">
                {spot.address}
              </span>
              <span className="mt-1 block text-xs text-slate-400">
                いいね {spot.likeCount}件
              </span>
            </button>
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
    </div>
  );
}
