/** 日本全体が見える初期表示の中心(AI_SPECIFICATION.md §15.1) */
export const JAPAN_CENTER: google.maps.LatLngLiteral = {
  lat: 36.2048,
  lng: 138.2529,
};

export const JAPAN_INITIAL_ZOOM = 5;

const CALLBACK_NAME = "__seichiGoogleMapsCallback";

let loadPromise: Promise<void> | null = null;

declare global {
  interface Window {
    [CALLBACK_NAME]?: () => void;
  }
}

export function getMapId(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_MAP_ID ?? "DEMO_MAP_ID";
}

/**
 * Maps JavaScript APIが読み込み済みか判定する。
 * `google` は @types/google.maps では常に定義済みとして型付けされるが、
 * 実際にはスクリプト読み込み前は undefined のため、緩い型で実行時チェックする。
 */
function isMapsLoaded(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const maybeGoogle = (
    window as unknown as {
      google?: { maps?: { importLibrary?: unknown } };
    }
  ).google;
  return typeof maybeGoogle?.maps?.importLibrary === "function";
}

/**
 * Maps JavaScript APIを1回だけ読み込む。
 * 各コンポーネントで重複ロードせず、必ずこのローダーを経由する。
 */
export function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("Google Mapsはブラウザでのみ読み込めます。"),
    );
  }
  if (isMapsLoaded()) {
    return Promise.resolve();
  }
  if (loadPromise) {
    return loadPromise;
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return Promise.reject(
      new Error("Google Maps APIキーが設定されていません。"),
    );
  }

  loadPromise = new Promise<void>((resolve, reject) => {
    window[CALLBACK_NAME] = () => {
      delete window[CALLBACK_NAME];
      resolve();
    };
    const script = document.createElement("script");
    const params = new URLSearchParams({
      key: apiKey,
      v: "weekly",
      language: "ja",
      region: "JP",
      loading: "async",
      callback: CALLBACK_NAME,
    });
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.onerror = () => {
      loadPromise = null;
      delete window[CALLBACK_NAME];
      reject(new Error("Google Mapsの読み込みに失敗しました。"));
    };
    document.head.appendChild(script);
  });
  return loadPromise;
}

/** 必要なライブラリだけを動的に読み込む(maps) */
export async function importMapsLibrary(): Promise<google.maps.MapsLibrary> {
  await loadGoogleMaps();
  return (await google.maps.importLibrary("maps")) as google.maps.MapsLibrary;
}

/** 必要なライブラリだけを動的に読み込む(marker) */
export async function importMarkerLibrary(): Promise<google.maps.MarkerLibrary> {
  await loadGoogleMaps();
  return (await google.maps.importLibrary(
    "marker",
  )) as google.maps.MarkerLibrary;
}

/** 必要なライブラリだけを動的に読み込む(geocoding) */
export async function importGeocodingLibrary(): Promise<google.maps.GeocodingLibrary> {
  await loadGoogleMaps();
  return (await google.maps.importLibrary(
    "geocoding",
  )) as google.maps.GeocodingLibrary;
}
