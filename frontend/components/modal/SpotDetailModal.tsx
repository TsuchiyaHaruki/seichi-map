"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { SpotDetail, SpotImage } from "@/types/spot";
import { fetchSpotDetail } from "@/lib/api/spots";
import { fetchSpotImages, spotImageUrl } from "@/lib/api/spotImages";
import { addLike, removeLike } from "@/lib/api/likes";
import { addFavorite, removeFavorite } from "@/lib/api/favorites";
import { ApiError } from "@/lib/api/client";
import type { LatLng } from "@/lib/maps/distance";
import { formatDistance, haversineDistanceKm } from "@/lib/maps/distance";
import { walkingRouteUrl } from "@/lib/maps/routeUrl";
import { categoryLabel } from "@/lib/constants";
import { useAuth } from "@/components/auth/AuthProvider";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { TrustBadge } from "@/components/ui/TrustBadge";

interface SpotDetailModalProps {
  spotId: number | null;
  open: boolean;
  onClose: () => void;
  currentPosition?: LatLng | null;
  onChanged?: () => void;
}

const TITLE_ID = "spot-detail-modal-title";

function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  return "エラーが発生しました。時間をおいて再度お試しください。";
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SpotDetailModal({
  spotId,
  open,
  onClose,
  currentPosition = null,
  onChanged,
}: SpotDetailModalProps) {
  const { user } = useAuth();
  const [detail, setDetail] = useState<SpotDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [likePending, setLikePending] = useState(false);
  const [favoritePending, setFavoritePending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loginPromptVisible, setLoginPromptVisible] = useState(false);
  const [images, setImages] = useState<SpotImage[]>([]);

  useEffect(() => {
    if (!open || spotId === null) {
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setDetail(null);
    setActionError(null);
    setLoginPromptVisible(false);
    setImages([]);
    fetchSpotDetail(spotId, controller.signal)
      .then((result) => setDetail(result))
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        setError(toErrorMessage(e));
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });
    // 画像は取得できなくても詳細表示は続ける
    fetchSpotImages(spotId, controller.signal)
      .then((result) => setImages(result))
      .catch(() => undefined);
    return () => controller.abort();
  }, [open, spotId, reloadKey]);

  const handleRetry = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  const requireLogin = useCallback((): boolean => {
    if (user) {
      setLoginPromptVisible(false);
      return false;
    }
    setLoginPromptVisible(true);
    return true;
  }, [user]);

  const handleToggleLike = useCallback(async () => {
    if (!detail || likePending || favoritePending) return;
    if (requireLogin()) return;
    setLikePending(true);
    setActionError(null);
    try {
      if (detail.likedByCurrentUser) {
        await removeLike(detail.id);
      } else {
        await addLike(detail.id);
      }
      const fresh = await fetchSpotDetail(detail.id);
      setDetail(fresh);
      onChanged?.();
    } catch (e: unknown) {
      setActionError(toErrorMessage(e));
    } finally {
      setLikePending(false);
    }
  }, [detail, likePending, favoritePending, requireLogin, onChanged]);

  const handleToggleFavorite = useCallback(async () => {
    if (!detail || likePending || favoritePending) return;
    if (requireLogin()) return;
    setFavoritePending(true);
    setActionError(null);
    try {
      if (detail.favoritedByCurrentUser) {
        await removeFavorite(detail.id);
      } else {
        await addFavorite(detail.id);
      }
      const fresh = await fetchSpotDetail(detail.id);
      setDetail(fresh);
      onChanged?.();
    } catch (e: unknown) {
      setActionError(toErrorMessage(e));
    } finally {
      setFavoritePending(false);
    }
  }, [detail, likePending, favoritePending, requireLogin, onChanged]);

  const distanceText =
    detail && currentPosition
      ? formatDistance(
          haversineDistanceKm(currentPosition, {
            lat: detail.latitude,
            lng: detail.longitude,
          }),
        )
      : null;

  return (
    <Modal
      open={open && spotId !== null}
      onClose={onClose}
      titleId={TITLE_ID}
      widthClassName="max-w-2xl"
    >
      {(loading || (!error && !detail)) && (
        <div className="flex flex-col items-center gap-3 py-10">
          <h2 id={TITLE_ID} className="sr-only">
            聖地詳細を読み込み中
          </h2>
          <Spinner size="lg" />
          <p className="text-sm text-slate-600">読み込んでいます...</p>
        </div>
      )}

      {!loading && error && (
        <div className="py-6">
          <h2 id={TITLE_ID} className="mb-3 text-lg font-bold text-slate-900">
            聖地詳細
          </h2>
          <ErrorMessage message={error} onRetry={handleRetry} />
        </div>
      )}

      {!loading && !error && detail && (
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-medium text-indigo-700">
              {detail.workName}
            </p>
            <h2 id={TITLE_ID} className="mt-1 text-xl font-bold text-slate-900">
              {detail.spotName}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <TrustBadge label={detail.trustLabel} />
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                {categoryLabel(detail.category)}
              </span>
            </div>
          </div>

          {images.length > 0 && (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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

          <dl className="flex flex-col gap-3 text-sm">
            <div>
              <dt className="font-medium text-slate-500">住所</dt>
              <dd className="mt-0.5 text-slate-900">{detail.address}</dd>
            </div>
            {distanceText && (
              <div>
                <dt className="font-medium text-slate-500">現在地からの距離</dt>
                <dd className="mt-0.5 text-slate-900">約{distanceText}(直線距離)</dd>
              </div>
            )}
            {detail.sceneDescription && (
              <div>
                <dt className="font-medium text-slate-500">登場場面</dt>
                <dd className="mt-0.5 whitespace-pre-wrap text-slate-900">
                  {detail.sceneDescription}
                </dd>
              </div>
            )}
            {detail.description && (
              <div>
                <dt className="font-medium text-slate-500">説明</dt>
                <dd className="mt-0.5 whitespace-pre-wrap text-slate-900">
                  {detail.description}
                </dd>
              </div>
            )}
            {(detail.sourceUrl || detail.sourceDescription) && (
              <div>
                <dt className="font-medium text-slate-500">出典</dt>
                <dd className="mt-0.5 text-slate-900">
                  {detail.sourceUrl && (
                    <a
                      href={detail.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-indigo-600 underline hover:text-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                    >
                      {detail.sourceUrl}
                    </a>
                  )}
                  {detail.sourceDescription && (
                    <p className="mt-0.5 whitespace-pre-wrap">
                      {detail.sourceDescription}
                    </p>
                  )}
                </dd>
              </div>
            )}
            <div>
              <dt className="font-medium text-slate-500">投稿者</dt>
              <dd className="mt-0.5 text-slate-900">{detail.registrantName}</dd>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              <div>
                <dt className="font-medium text-slate-500">登録日時</dt>
                <dd className="mt-0.5 text-slate-900">
                  {formatDateTime(detail.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">更新日時</dt>
                <dd className="mt-0.5 text-slate-900">
                  {formatDateTime(detail.updatedAt)}
                </dd>
              </div>
            </div>
          </dl>

          {loginPromptVisible && (
            <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              いいね・お気に入りにはログインが必要です。{" "}
              <Link
                href="/login"
                className="font-medium text-indigo-600 underline hover:text-indigo-800"
              >
                ログインする
              </Link>
            </p>
          )}
          {actionError && (
            <p className="text-sm text-red-600" role="alert">
              {actionError}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={handleToggleLike}
              disabled={likePending}
              aria-pressed={detail.likedByCurrentUser}
              aria-label={
                detail.likedByCurrentUser
                  ? `いいねを取り消す(現在${detail.likeCount}件)`
                  : `いいねする(現在${detail.likeCount}件)`
              }
              className={`inline-flex min-h-11 items-center gap-1.5 rounded-md border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 ${
                detail.likedByCurrentUser
                  ? "border-red-300 bg-red-50 text-red-700"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span aria-hidden="true">♥</span>
              いいね {detail.likeCount}
            </button>
            <button
              type="button"
              onClick={handleToggleFavorite}
              disabled={favoritePending}
              aria-pressed={detail.favoritedByCurrentUser}
              aria-label={
                detail.favoritedByCurrentUser
                  ? "お気に入りを解除する"
                  : "お気に入りに追加する"
              }
              className={`inline-flex min-h-11 items-center gap-1.5 rounded-md border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 ${
                detail.favoritedByCurrentUser
                  ? "border-amber-300 bg-amber-50 text-amber-700"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span aria-hidden="true">
                {detail.favoritedByCurrentUser ? "★" : "☆"}
              </span>
              {detail.favoritedByCurrentUser ? "お気に入り済み" : "お気に入り"}
            </button>
            <a
              href={walkingRouteUrl(detail.latitude, detail.longitude)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-md bg-indigo-600 px-4 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              Googleマップで経路を見る
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default SpotDetailModal;
