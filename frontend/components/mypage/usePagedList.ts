"use client";

import { useCallback, useEffect, useState } from "react";
import type { PageResponse } from "@/types/api";

export interface PagedListState<T> {
  items: T[];
  page: number;
  totalPages: number;
  totalElements: number;
  loading: boolean;
  error: string | null;
  setPage: (page: number) => void;
  reload: () => void;
}

/**
 * ページネーション付き一覧の共通取得ロジック。
 * fetcherは呼び出し側でuseCallbackにより安定化させること。
 */
export function usePagedList<T>(
  fetcher: (page: number, signal: AbortSignal) => Promise<PageResponse<T>>,
): PagedListState<T> {
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetcher(page, controller.signal)
      .then((response) => {
        if (controller.signal.aborted) {
          return;
        }
        // 削除等で現在ページが範囲外になった場合は最終ページへ戻す
        if (response.totalPages > 0 && page >= response.totalPages) {
          setPage(response.totalPages - 1);
          return;
        }
        setData(response);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setError(
          e instanceof Error ? e.message : "一覧の取得に失敗しました。",
        );
        setLoading(false);
      });
    return () => controller.abort();
  }, [fetcher, page, reloadKey]);

  const reload = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  return {
    items: data?.items ?? [],
    page,
    totalPages: data?.totalPages ?? 0,
    totalElements: data?.totalElements ?? 0,
    loading,
    error,
    setPage,
    reload,
  };
}

/** ISO 8601日時を日本語表記へ変換する */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
