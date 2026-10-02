/**
 * Googleマップの徒歩経路URLを生成する(AI_SPECIFICATION.md §15.7)。
 * 経路はアプリ内で表示せず、Googleマップを外部で開く。
 */
export function walkingRouteUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=walking`;
}
