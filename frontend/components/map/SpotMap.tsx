"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { SpotMapItem, TrustLabel } from "@/types/spot";
import type { LatLng } from "@/lib/maps/distance";
import {
  JAPAN_CENTER,
  JAPAN_INITIAL_ZOOM,
  getMapId,
  importMapsLibrary,
  importMarkerLibrary,
} from "@/lib/maps/loader";
import { Spinner } from "@/components/ui/Spinner";
import { TRUST_TEXT_CLASSES } from "@/components/ui/TrustBadge";

interface SpotMapProps {
  spots: SpotMapItem[];
  currentPosition: LatLng | null;
  selectedSpotId?: number | null;
  /** ピンをクリックしたとき(地図の移動とポップアップ表示のみ) */
  onSelectSpot?: (id: number) => void;
  /** ポップアップの「詳細」を押したとき(詳細モーダルを開く) */
  onOpenDetail?: (id: number) => void;
  /** ポップアップを閉じたとき(選択解除) */
  onDeselectSpot?: () => void;
  /**
   * 表示範囲を合わせ直す条件。この値が変わったときだけ全体が入るように地図を動かす。
   * 値が同じまま聖地が入れ替わっても(いいね・お気に入りの絞り込みなど)地図の位置は保つ。
   */
  viewKey?: string;
  className?: string;
}

export interface SpotMapHandle {
  /** 指定した位置へ地図を移動する(現在地へ移動ボタンから利用する) */
  moveTo: (position: LatLng) => void;
}

/** trustLabel別のピン配色とグリフ(色だけで区分せずtitle・グリフを併用する) */
const PIN_STYLES: Record<
  TrustLabel,
  { background: string; borderColor: string; glyph: string }
> = {
  管理者登録: { background: "#2563eb", borderColor: "#1e3a8a", glyph: "管" },
  管理者確認済み: { background: "#16a34a", borderColor: "#14532d", glyph: "済" },
  確認待ち: { background: "#ca8a04", borderColor: "#713f12", glyph: "待" },
  却下: { background: "#dc2626", borderColor: "#7f1d1d", glyph: "却" },
};

type LoadStatus = "loading" | "ready" | "error";

/** ピンのポップアップ内容(作品名・聖地名・信頼性ラベルと詳細ボタン)を組み立てる */
function createInfoContent(spot: SpotMapItem, onDetail: () => void): HTMLElement {
  const root = document.createElement("div");
  root.className = "max-w-52";

  const spotName = document.createElement("p");
  spotName.className = "text-sm font-semibold leading-snug text-slate-900";
  spotName.textContent = spot.spotName;

  // 信頼性ラベルと詳細ボタンを同じ行に置き、吹き出しの高さを抑える
  const footer = document.createElement("div");
  footer.className = "mt-1 flex items-center justify-between gap-2";

  const trustLabel = document.createElement("span");
  // 一覧や詳細の信頼性バッジと同じ文字色にそろえる
  trustLabel.className = `text-xs font-medium ${
    TRUST_TEXT_CLASSES[spot.trustLabel] ?? TRUST_TEXT_CLASSES["確認待ち"]
  }`;
  trustLabel.textContent = spot.trustLabel;

  const detailButton = document.createElement("button");
  detailButton.type = "button";
  detailButton.className =
    "inline-flex min-h-11 shrink-0 items-center justify-center rounded-md bg-indigo-600 px-3 text-sm font-medium text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2";
  detailButton.textContent = "詳細";
  detailButton.setAttribute("aria-label", `${spot.spotName}の詳細`);
  detailButton.addEventListener("click", onDetail);

  footer.append(trustLabel, detailButton);
  root.append(spotName, footer);
  return root;
}

/** 閉じるボタンの横(ヘッダー)に置く作品名。本文を1行減らして吹き出しを小さくする */
function createInfoHeader(spot: SpotMapItem): HTMLElement {
  const workName = document.createElement("span");
  workName.className =
    "block max-w-36 truncate text-xs font-medium text-indigo-700";
  workName.textContent = spot.workName;
  workName.title = spot.workName;
  return workName;
}

function createCurrentPositionContent(): HTMLElement {
  const dot = document.createElement("div");
  dot.style.width = "18px";
  dot.style.height = "18px";
  dot.style.borderRadius = "50%";
  dot.style.backgroundColor = "#1d4ed8";
  dot.style.border = "3px solid #ffffff";
  dot.style.boxShadow = "0 0 0 2px rgba(29, 78, 216, 0.4)";
  dot.setAttribute("aria-hidden", "true");
  return dot;
}

export const SpotMap = forwardRef<SpotMapHandle, SpotMapProps>(function SpotMap(
  {
    spots,
    currentPosition,
    selectedSpotId,
    onSelectSpot,
    onOpenDetail,
    onDeselectSpot,
    viewKey,
    className,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerLibRef = useRef<google.maps.MarkerLibrary | null>(null);
  const markersRef = useRef<
    Map<number, { marker: google.maps.marker.AdvancedMarkerElement; position: LatLng }>
  >(new Map());
  const currentMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(
    null,
  );
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  /** 直近で表示範囲を合わせたときのviewKey(nullは未実施) */
  const fittedViewKeyRef = useRef<string | null>(null);
  /** ポップアップを表示中の聖地ID(未表示はnull) */
  const infoOpenIdRef = useRef<number | null>(null);
  const onSelectRef = useRef<((id: number) => void) | undefined>(onSelectSpot);
  const onOpenDetailRef = useRef<((id: number) => void) | undefined>(
    onOpenDetail,
  );
  const onDeselectRef = useRef<(() => void) | undefined>(onDeselectSpot);
  const [status, setStatus] = useState<LoadStatus>("loading");

  useEffect(() => {
    onSelectRef.current = onSelectSpot;
    onOpenDetailRef.current = onOpenDetail;
    onDeselectRef.current = onDeselectSpot;
  }, [onSelectSpot, onOpenDetail, onDeselectSpot]);

  useImperativeHandle(ref, () => ({
    moveTo(position: LatLng) {
      const map = mapRef.current;
      if (!map) {
        return;
      }
      map.panTo(position);
      const zoom = map.getZoom();
      if (zoom === undefined || zoom < 15) {
        map.setZoom(15);
      }
    },
  }));

  const closeInfoWindow = useCallback(() => {
    infoOpenIdRef.current = null;
    infoWindowRef.current?.close();
  }, []);

  /** 指定した聖地のマーカーにポップアップを開く */
  const openInfoWindow = useCallback((spot: SpotMapItem) => {
    const map = mapRef.current;
    const infoWindow = infoWindowRef.current;
    const entry = markersRef.current.get(spot.id);
    if (!map || !infoWindow || !entry) {
      return;
    }
    infoWindow.setContent(
      createInfoContent(spot, () => onOpenDetailRef.current?.(spot.id)),
    );
    infoWindow.setOptions({
      ariaLabel: spot.spotName,
      headerContent: createInfoHeader(spot),
    });
    infoWindow.open({ map, anchor: entry.marker });
    infoOpenIdRef.current = spot.id;
  }, []);

  useEffect(() => {
    let cancelled = false;
    const markers = markersRef.current;
    (async () => {
      try {
        const [{ Map: GoogleMap, InfoWindow }, markerLib] = await Promise.all([
          importMapsLibrary(),
          importMarkerLibrary(),
        ]);
        if (cancelled || !containerRef.current) {
          return;
        }
        mapRef.current = new GoogleMap(containerRef.current, {
          center: JAPAN_CENTER,
          zoom: JAPAN_INITIAL_ZOOM,
          minZoom: 4,
          maxZoom: 20,
          mapId: getMapId(),
          zoomControl: true,
          fullscreenControl: true,
          streetViewControl: false,
          mapTypeControl: true,
          gestureHandling: "greedy",
        });
        markerLibRef.current = markerLib;
        const infoWindow = new InfoWindow({ maxWidth: 230 });
        // ポップアップの×で閉じたときは選択も解除し、同じピンを再度押せるようにする
        infoWindow.addListener("closeclick", () => {
          infoOpenIdRef.current = null;
          onDeselectRef.current?.();
        });
        infoWindowRef.current = infoWindow;
        setStatus("ready");
      } catch {
        if (!cancelled) {
          setStatus("error");
        }
      }
    })();
    return () => {
      cancelled = true;
      markers.forEach(({ marker }) => {
        marker.map = null;
      });
      markers.clear();
      if (currentMarkerRef.current) {
        currentMarkerRef.current.map = null;
        currentMarkerRef.current = null;
      }
      infoWindowRef.current?.close();
      infoWindowRef.current = null;
      infoOpenIdRef.current = null;
    };
  }, []);

  // 聖地マーカーの作成とfitBounds
  useEffect(() => {
    const map = mapRef.current;
    const markerLib = markerLibRef.current;
    if (status !== "ready" || !map || !markerLib) {
      return;
    }
    const { AdvancedMarkerElement, PinElement } = markerLib;

    // 作り直す前に、消えるマーカーへ紐づいたポップアップを閉じる
    closeInfoWindow();
    markersRef.current.forEach(({ marker }) => {
      marker.map = null;
    });
    markersRef.current.clear();

    for (const spot of spots) {
      const style = PIN_STYLES[spot.trustLabel] ?? PIN_STYLES["確認待ち"];
      const pin = new PinElement({
        background: style.background,
        borderColor: style.borderColor,
        glyph: style.glyph,
        glyphColor: "#ffffff",
        scale: 1.1,
      });
      const position: LatLng = { lat: spot.latitude, lng: spot.longitude };
      const marker = new AdvancedMarkerElement({
        map,
        position,
        content: pin.element,
        title: `${spot.spotName}(${spot.trustLabel})`,
        gmpClickable: true,
      });
      // ピンのクリックでは詳細モーダルを開かず、選択(地図移動)とポップアップ表示だけ行う
      marker.addListener("click", () => {
        onSelectRef.current?.(spot.id);
        openInfoWindow(spot);
      });
      markersRef.current.set(spot.id, { marker, position });
    }

    // 検索条件(viewKey)が変わったときだけ表示範囲を合わせ直す
    const key = viewKey ?? "";
    if (spots.length === 0 || fittedViewKeyRef.current === key) {
      return;
    }
    fittedViewKeyRef.current = key;
    if (spots.length === 1) {
      map.panTo({ lat: spots[0].latitude, lng: spots[0].longitude });
      map.setZoom(14);
    } else {
      const bounds = new google.maps.LatLngBounds();
      for (const spot of spots) {
        bounds.extend({ lat: spot.latitude, lng: spot.longitude });
      }
      map.fitBounds(bounds);
    }
  }, [spots, status, viewKey, closeInfoWindow, openInfoWindow]);

  // 選択中の聖地へpanToし、ポップアップを表示する
  useEffect(() => {
    const map = mapRef.current;
    if (status !== "ready" || !map) {
      return;
    }
    if (selectedSpotId == null) {
      closeInfoWindow();
      return;
    }
    const entry = markersRef.current.get(selectedSpotId);
    const spot = spots.find((item) => item.id === selectedSpotId);
    if (!entry || !spot) {
      return;
    }
    map.panTo(entry.position);
    const zoom = map.getZoom();
    if (zoom === undefined || zoom < 15) {
      map.setZoom(15);
    }
    // ピンのクリック経由で既に開いている場合は開き直さない
    if (infoOpenIdRef.current !== selectedSpotId) {
      openInfoWindow(spot);
    }
  }, [selectedSpotId, spots, status, closeInfoWindow, openInfoWindow]);

  // 現在地専用マーカー(聖地マーカーと区別できる青丸ドット)
  useEffect(() => {
    const map = mapRef.current;
    const markerLib = markerLibRef.current;
    if (status !== "ready" || !map || !markerLib) {
      return;
    }
    if (!currentPosition) {
      if (currentMarkerRef.current) {
        currentMarkerRef.current.map = null;
        currentMarkerRef.current = null;
      }
      return;
    }
    if (currentMarkerRef.current) {
      currentMarkerRef.current.position = currentPosition;
      return;
    }
    currentMarkerRef.current = new markerLib.AdvancedMarkerElement({
      map,
      position: currentPosition,
      content: createCurrentPositionContent(),
      title: "現在地",
      zIndex: 1000,
    });
  }, [currentPosition, status]);

  return (
    <div className={`relative overflow-hidden rounded-lg ${className ?? ""}`}>
      <div ref={containerRef} className="h-full w-full" aria-label="聖地マップ" />
      {status === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-100">
          <Spinner size="md" />
          <p className="text-sm text-slate-600">地図を読み込んでいます…</p>
        </div>
      )}
      {status === "error" && (
        <div
          role="alert"
          className="absolute inset-0 flex items-center justify-center bg-slate-100 p-4"
        >
          <p className="text-center text-sm text-slate-700">
            地図を読み込めませんでした。
            <br />
            検索と一覧は引き続きご利用いただけます。
          </p>
        </div>
      )}
    </div>
  );
});
