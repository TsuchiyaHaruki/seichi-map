import type { PageResponse } from "@/types/api";
import type {
  SpotDetail,
  SpotListItem,
  SpotMapItem,
  SpotRequest,
  SpotSearchParams,
} from "@/types/spot";
import { apiFetch } from "@/lib/api/client";

export async function searchSpots(
  params: SpotSearchParams = {},
  signal?: AbortSignal,
): Promise<PageResponse<SpotListItem>> {
  return apiFetch<PageResponse<SpotListItem>>("/api/v1/sacred-spots", {
    searchParams: { ...params },
    signal,
  });
}

export async function fetchMapSpots(
  params: Omit<SpotSearchParams, "page" | "size" | "sort"> = {},
  signal?: AbortSignal,
): Promise<SpotMapItem[]> {
  return apiFetch<SpotMapItem[]>("/api/v1/sacred-spots/map", {
    searchParams: { ...params },
    signal,
  });
}

export async function fetchSpotDetail(
  id: number,
  signal?: AbortSignal,
): Promise<SpotDetail> {
  return apiFetch<SpotDetail>(`/api/v1/sacred-spots/${id}`, { signal });
}

export async function createSpot(request: SpotRequest): Promise<SpotDetail> {
  return apiFetch<SpotDetail>("/api/v1/sacred-spots", {
    method: "POST",
    body: request,
  });
}

export async function updateSpot(
  id: number,
  request: SpotRequest,
): Promise<SpotDetail> {
  return apiFetch<SpotDetail>(`/api/v1/sacred-spots/${id}`, {
    method: "PUT",
    body: request,
  });
}

export async function deleteSpot(id: number): Promise<void> {
  await apiFetch<void>(`/api/v1/sacred-spots/${id}`, { method: "DELETE" });
}
