"use client";

import type { SpotListItem } from "@/types/spot";
import type { LatLng } from "@/lib/maps/distance";
import { formatDistance, haversineDistanceKm } from "@/lib/maps/distance";
import { categoryLabel } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { TrustBadge } from "@/components/ui/TrustBadge";

interface SpotListProps {
  spots: SpotListItem[];
  currentPosition: LatLng | null;
  selectedSpotId: number | null;
  /** 行の選択(地図をその聖地へ移動する) */
  onSelect: (id: number) => void;
  /** 「詳細」ボタン(詳細モーダルを開く) */
  onOpenDetail: (id: number) => void;
}

export function SpotList({
  spots,
  currentPosition,
  selectedSpotId,
  onSelect,
  onOpenDetail,
}: SpotListProps) {
  return (
    <ul className="flex flex-col gap-2" aria-label="聖地一覧">
      {spots.map((spot) => {
        const selected = spot.id === selectedSpotId;
        return (
          <li key={spot.id}>
            <div
              className={`flex flex-col gap-2 rounded-lg border p-3 transition-colors sm:flex-row sm:items-start sm:justify-between ${
                selected
                  ? "border-indigo-400 bg-indigo-50"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(spot.id)}
                aria-pressed={selected}
                className="block min-h-11 w-full flex-1 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-indigo-700">
                    {spot.workName}
                  </span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                    {categoryLabel(spot.category)}
                  </span>
                </div>
                <p className="mt-1 font-semibold text-slate-900">
                  {spot.spotName}
                </p>
                <p className="mt-0.5 text-sm text-slate-600">{spot.address}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <TrustBadge label={spot.trustLabel} />
                  <span
                    className="text-slate-600"
                    aria-label={`いいね ${spot.likeCount}件`}
                  >
                    <span aria-hidden="true">♥</span> {spot.likeCount}
                  </span>
                  {currentPosition && (
                    <span className="text-slate-600">
                      現在地から約
                      {formatDistance(
                        haversineDistanceKm(currentPosition, {
                          lat: spot.latitude,
                          lng: spot.longitude,
                        }),
                      )}
                    </span>
                  )}
                </div>
              </button>
              <Button
                type="button"
                variant="secondary"
                aria-label={`${spot.spotName}の詳細`}
                onClick={() => onOpenDetail(spot.id)}
                className="shrink-0"
              >
                詳細
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
