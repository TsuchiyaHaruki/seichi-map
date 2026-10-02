"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { LatLng } from "@/lib/maps/distance";
import {
  JAPAN_CENTER,
  JAPAN_INITIAL_ZOOM,
  getMapId,
  importGeocodingLibrary,
  importMapsLibrary,
  importMarkerLibrary,
} from "@/lib/maps/loader";
import { Spinner } from "@/components/ui/Spinner";

interface LocationPickerProps {
  value: LatLng | null;
  onChange: (
    position: LatLng,
    resolvedAddress?: string,
    prefecture?: string,
  ) => void;
  initialCenter?: LatLng;
}

export interface LocationPickerHandle {
  searchAddress: (address: string) => Promise<void>;
}

type LoadStatus = "loading" | "ready" | "error";

interface Candidate {
  address: string;
  position: LatLng;
  prefecture?: string;
}

function extractPrefecture(
  components: google.maps.GeocoderAddressComponent[] | undefined,
): string | undefined {
  return components?.find((component) =>
    component.types.includes("administrative_area_level_1"),
  )?.long_name;
}

function cleanAddress(formattedAddress: string): string {
  return formattedAddress
    .replace(/^日本[、,]\s*/, "")
    .replace(/〒\d{3}-\d{4}\s*/, "")
    .trim();
}

function toCandidate(result: google.maps.GeocoderResult): Candidate {
  return {
    address: cleanAddress(result.formatted_address),
    position: {
      lat: result.geometry.location.lat(),
      lng: result.geometry.location.lng(),
    },
    prefecture: extractPrefecture(result.address_components),
  };
}

function isZeroResults(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code;
  return code === "ZERO_RESULTS" || String(error).includes("ZERO_RESULTS");
}

function samePosition(a: LatLng | null, b: LatLng | null): boolean {
  if (!a || !b) {
    return a === b;
  }
  return Math.abs(a.lat - b.lat) < 1e-7 && Math.abs(a.lng - b.lng) < 1e-7;
}

export const LocationPicker = forwardRef<
  LocationPickerHandle,
  LocationPickerProps
>(function LocationPicker({ value, onChange, initialCenter }, ref) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const markerLibRef = useRef<google.maps.MarkerLibrary | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(
    null,
  );
  const markerPositionRef = useRef<LatLng | null>(null);
  const onChangeRef = useRef(onChange);
  const searchingRef = useRef(false);

  const [status, setStatus] = useState<LoadStatus>("loading");
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  /** 仮マーカーを配置(なければ作成)する。ドラッグで位置調整できる */
  const placeMarker = (position: LatLng) => {
    const map = mapRef.current;
    const markerLib = markerLibRef.current;
    if (!map || !markerLib) {
      return;
    }
    markerPositionRef.current = position;
    if (markerRef.current) {
      markerRef.current.position = position;
      return;
    }
    const pin = new markerLib.PinElement({
      background: "#4f46e5",
      borderColor: "#312e81",
      glyphColor: "#ffffff",
      scale: 1.2,
    });
    const marker = new markerLib.AdvancedMarkerElement({
      map,
      position,
      content: pin.element,
      title: "聖地の位置(ドラッグで調整できます)",
      gmpDraggable: true,
    });
    marker.addListener("dragend", () => {
      const pos = marker.position;
      if (!pos) {
        return;
      }
      const latLng: LatLng =
        typeof (pos as google.maps.LatLng).lat === "function"
          ? {
              lat: (pos as google.maps.LatLng).lat(),
              lng: (pos as google.maps.LatLng).lng(),
            }
          : {
              lat: (pos as google.maps.LatLngLiteral).lat,
              lng: (pos as google.maps.LatLngLiteral).lng,
            };
      markerPositionRef.current = latLng;
      void reverseGeocodeAndNotify(latLng);
    });
    markerRef.current = marker;
  };

  /** 逆ジオコーディングで住所候補・都道府県を取得してonChangeで通知する(失敗しても座標は通知する) */
  const reverseGeocodeAndNotify = async (position: LatLng) => {
    const geocoder = geocoderRef.current;
    if (!geocoder) {
      onChangeRef.current(position);
      return;
    }
    try {
      const { results } = await geocoder.geocode({ location: position });
      const first = results[0];
      if (first) {
        const candidate = toCandidate(first);
        onChangeRef.current(position, candidate.address, candidate.prefecture);
      } else {
        onChangeRef.current(position);
      }
    } catch {
      onChangeRef.current(position);
    }
  };

  const applyCandidate = (candidate: Candidate) => {
    const map = mapRef.current;
    setCandidates([]);
    setMessage(null);
    if (map) {
      map.panTo(candidate.position);
      map.setZoom(16);
    }
    placeMarker(candidate.position);
    onChangeRef.current(
      candidate.position,
      candidate.address,
      candidate.prefecture,
    );
  };

  useImperativeHandle(ref, () => ({
    async searchAddress(address: string) {
      // 連打防止: 検索中は新しい検索を受け付けない
      if (searchingRef.current) {
        return;
      }
      if (!address.trim()) {
        setMessage("住所を入力してから検索してください。");
        return;
      }
      if (status === "error" || !geocoderRef.current) {
        setMessage(
          "地図を読み込めていないため住所検索を利用できません。ページを再読み込みしてお試しください。",
        );
        return;
      }
      searchingRef.current = true;
      setSearching(true);
      setMessage(null);
      setCandidates([]);
      try {
        const { results } = await geocoderRef.current.geocode({
          address,
          region: "JP",
        });
        if (results.length === 0) {
          setMessage(
            "該当する場所が見つかりませんでした。住所を修正して再度検索してください。",
          );
        } else if (results.length === 1) {
          applyCandidate(toCandidate(results[0]));
        } else {
          setCandidates(results.map(toCandidate));
        }
      } catch (error) {
        if (isZeroResults(error)) {
          setMessage(
            "該当する場所が見つかりませんでした。住所を修正して再度検索してください。",
          );
        } else {
          setMessage(
            "住所の検索に失敗しました。時間をおいて再度お試しいただくか、地図をクリックして位置を指定してください。",
          );
        }
      } finally {
        searchingRef.current = false;
        setSearching(false);
      }
    },
  }));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [{ Map: GoogleMap }, markerLib, { Geocoder }] = await Promise.all(
          [importMapsLibrary(), importMarkerLibrary(), importGeocodingLibrary()],
        );
        if (cancelled || !containerRef.current) {
          return;
        }
        const center = value ?? initialCenter ?? JAPAN_CENTER;
        const map = new GoogleMap(containerRef.current, {
          center,
          zoom: value || initialCenter ? 15 : JAPAN_INITIAL_ZOOM,
          minZoom: 4,
          maxZoom: 20,
          mapId: getMapId(),
          zoomControl: true,
          fullscreenControl: false,
          streetViewControl: false,
          mapTypeControl: false,
          gestureHandling: "greedy",
        });
        map.addListener("click", (event: google.maps.MapMouseEvent) => {
          if (!event.latLng) {
            return;
          }
          const position: LatLng = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng(),
          };
          placeMarker(position);
          void reverseGeocodeAndNotify(position);
        });
        mapRef.current = map;
        markerLibRef.current = markerLib;
        geocoderRef.current = new Geocoder();
        if (value) {
          placeMarker(value);
        }
        setStatus("ready");
      } catch {
        if (!cancelled) {
          setStatus("error");
        }
      }
    })();
    return () => {
      cancelled = true;
      if (markerRef.current) {
        markerRef.current.map = null;
        markerRef.current = null;
      }
    };
    // マウント時に1回だけ初期化する(value/initialCenterは初期表示にのみ使用)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 親からのvalue変更(緯度・経度の手動修正など)をマーカーへ反映する
  useEffect(() => {
    const map = mapRef.current;
    if (status !== "ready" || !map || !value) {
      return;
    }
    if (samePosition(markerPositionRef.current, value)) {
      return;
    }
    placeMarker(value);
    map.panTo(value);
    const zoom = map.getZoom();
    if (zoom === undefined || zoom < 14) {
      map.setZoom(14);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, status]);

  return (
    <div className="space-y-2">
      <div className="relative h-64 overflow-hidden rounded-lg border border-slate-200 sm:h-80">
        <div
          ref={containerRef}
          className="h-full w-full"
          aria-label="位置指定マップ"
        />
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
              緯度・経度を直接入力することもできます。
            </p>
          </div>
        )}
        {searching && (
          <div className="absolute inset-x-0 top-0 flex items-center justify-center gap-2 bg-white/90 py-2">
            <Spinner size="sm" />
            <p className="text-sm text-slate-700">住所を検索しています…</p>
          </div>
        )}
      </div>
      {status === "ready" && (
        <p className="text-xs text-slate-600">
          地図をクリックするか、マーカーをドラッグして正確な位置に調整してください。
        </p>
      )}
      {message && (
        <p role="alert" className="text-sm text-red-600">
          {message}
        </p>
      )}
      {candidates.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-sm font-medium text-slate-900">
            候補が{candidates.length}件見つかりました。位置を選択してください。
          </p>
          <ul className="mt-2 space-y-1">
            {candidates.map((candidate, index) => (
              <li key={`${candidate.address}-${index}`}>
                <button
                  type="button"
                  onClick={() => applyCandidate(candidate)}
                  className="min-h-11 w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-indigo-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                >
                  {candidate.address}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});
