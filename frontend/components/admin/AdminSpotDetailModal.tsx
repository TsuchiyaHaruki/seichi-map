"use client";

import { useEffect, useState } from "react";
import type { SpotDetail, SpotImage } from "@/types/spot";
import { fetchAdminSpotDetail } from "@/lib/api/admin";
import { fetchSpotImages, spotImageUrl } from "@/lib/api/spotImages";
import { categoryLabel } from "@/lib/constants";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { TrustBadge } from "@/components/ui/TrustBadge";
import { formatDateTime } from "@/components/mypage/usePagedList";

interface AdminSpotDetailModalProps {
  spotId: number | null;
  open: boolean;
  onClose: () => void;
}

/** 管理者用の聖地詳細モーダル(状態不問でfetchAdminSpotDetailを使用) */
export function AdminSpotDetailModal({
  spotId,
  open,
  onClose,
}: AdminSpotDetailModalProps) {
  const [detail, setDetail] = useState<SpotDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [images, setImages] = useState<SpotImage[]>([]);

  useEffect(() => {
    if (!open || spotId === null) {
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setDetail(null);
    setImages([]);
    // 画像は取得できなくても詳細表示は続ける
    fetchSpotImages(spotId, controller.signal)
      .then((result) => setImages(result))
      .catch(() => undefined);
    fetchAdminSpotDetail(spotId, controller.signal)
      .then((response) => {
        if (controller.signal.aborted) {
          return;
        }
        setDetail(response);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setError(
          e instanceof Error ? e.message : "詳細の取得に失敗しました。",
        );
        setLoading(false);
      });
    return () => controller.abort();
  }, [open, spotId, reloadKey]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      titleId="admin-spot-detail-title"
      widthClassName="max-w-2xl"
    >
      <h2
        id="admin-spot-detail-title"
        className="text-lg font-bold text-slate-900"
      >
        聖地詳細(管理者)
      </h2>
      <div className="mt-4">
        {loading && (
          <div className="flex justify-center py-8">
            <Spinner size="md" />
          </div>
        )}
        {error && (
          <ErrorMessage
            message={error}
            onRetry={() => setReloadKey((key) => key + 1)}
          />
        )}
        {detail && (
          <div className="space-y-3 text-sm text-slate-700">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold text-slate-900">
                {detail.spotName}
              </span>
              <TrustBadge label={detail.trustLabel} />
            </div>
            {images.length > 0 && (
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {images.map((image) => (
                  <li key={image.id}>
                    <a
                      href={spotImageUrl(detail.id, image.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block overflow-hidden rounded-lg border border-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                    >
                      {/* APIから配信する画像のためnext/imageは使わない */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={spotImageUrl(detail.id, image.id)}
                        alt={`${detail.spotName}の投稿画像`}
                        loading="lazy"
                        className="aspect-video w-full bg-slate-100 object-cover"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
              <div>
                <dt className="font-medium text-slate-500">作品名</dt>
                <dd>{detail.workName}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">カテゴリー</dt>
                <dd>{categoryLabel(detail.category)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-medium text-slate-500">住所</dt>
                <dd>
                  {detail.address}
                  {detail.prefecture ? `(${detail.prefecture})` : ""}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">緯度・経度</dt>
                <dd>
                  {detail.latitude}, {detail.longitude}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">投稿者</dt>
                <dd>{detail.registrantName}</dd>
              </div>
              {detail.sceneDescription && (
                <div className="sm:col-span-2">
                  <dt className="font-medium text-slate-500">登場場面</dt>
                  <dd className="whitespace-pre-wrap">
                    {detail.sceneDescription}
                  </dd>
                </div>
              )}
              {detail.description && (
                <div className="sm:col-span-2">
                  <dt className="font-medium text-slate-500">説明</dt>
                  <dd className="whitespace-pre-wrap">{detail.description}</dd>
                </div>
              )}
              {(detail.sourceUrl || detail.sourceDescription) && (
                <div className="sm:col-span-2">
                  <dt className="font-medium text-slate-500">出典</dt>
                  <dd>
                    {detail.sourceUrl && (
                      <a
                        href={detail.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-indigo-600 underline hover:text-indigo-700"
                      >
                        {detail.sourceUrl}
                      </a>
                    )}
                    {detail.sourceDescription && (
                      <span className="mt-1 block">
                        {detail.sourceDescription}
                      </span>
                    )}
                  </dd>
                </div>
              )}
              <div>
                <dt className="font-medium text-slate-500">いいね数</dt>
                <dd>{detail.likeCount}件</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">登録・更新日時</dt>
                <dd>
                  {formatDateTime(detail.createdAt)} /{" "}
                  {formatDateTime(detail.updatedAt)}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </Modal>
  );
}
