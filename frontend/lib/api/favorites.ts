import type { PageResponse } from "@/types/api";
import type { SpotListItem } from "@/types/spot";
import { apiFetch } from "@/lib/api/client";

export async function addFavorite(spotId: number): Promise<void> {
  await apiFetch<void>(`/api/v1/sacred-spots/${spotId}/favorites`, {
    method: "POST",
  });
}

export async function removeFavorite(spotId: number): Promise<void> {
  await apiFetch<void>(`/api/v1/sacred-spots/${spotId}/favorites`, {
    method: "DELETE",
  });
}

export async function fetchMyFavorites(
  page = 0,
  size = 20,
  signal?: AbortSignal,
): Promise<PageResponse<SpotListItem>> {
  return apiFetch<PageResponse<SpotListItem>>("/api/v1/users/me/favorites", {
    searchParams: { page, size },
    signal,
  });
}
