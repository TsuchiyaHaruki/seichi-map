import { apiFetch } from "@/lib/api/client";

export async function addLike(spotId: number): Promise<void> {
  await apiFetch<void>(`/api/v1/sacred-spots/${spotId}/likes`, {
    method: "POST",
  });
}

export async function removeLike(spotId: number): Promise<void> {
  await apiFetch<void>(`/api/v1/sacred-spots/${spotId}/likes`, {
    method: "DELETE",
  });
}
