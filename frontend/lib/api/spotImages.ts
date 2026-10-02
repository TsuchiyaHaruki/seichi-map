import type { SpotImage } from "@/types/spot";
import { apiFetch, apiUrl } from "@/lib/api/client";

/** 画像データ本体のURL(imgのsrcに指定する) */
export function spotImageUrl(spotId: number, imageId: number): string {
  return apiUrl(`/api/v1/sacred-spots/${spotId}/images/${imageId}`);
}

export async function fetchSpotImages(
  spotId: number,
  signal?: AbortSignal,
): Promise<SpotImage[]> {
  return apiFetch<SpotImage[]>(`/api/v1/sacred-spots/${spotId}/images`, {
    signal,
  });
}

export async function uploadSpotImage(
  spotId: number,
  file: File,
): Promise<SpotImage> {
  const form = new FormData();
  form.append("file", file);
  return apiFetch<SpotImage>(`/api/v1/sacred-spots/${spotId}/images`, {
    method: "POST",
    body: form,
  });
}

export async function deleteSpotImage(
  spotId: number,
  imageId: number,
): Promise<void> {
  await apiFetch<void>(`/api/v1/sacred-spots/${spotId}/images/${imageId}`, {
    method: "DELETE",
  });
}
