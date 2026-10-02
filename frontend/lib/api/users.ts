import type { PageResponse } from "@/types/api";
import type { MyPostItem, SpotListItem } from "@/types/spot";
import { apiFetch } from "@/lib/api/client";

export async function fetchMyPosts(
  page = 0,
  size = 20,
  signal?: AbortSignal,
): Promise<PageResponse<MyPostItem>> {
  return apiFetch<PageResponse<MyPostItem>>("/api/v1/users/me/posts", {
    searchParams: { page, size },
    signal,
  });
}

export async function fetchMyLikes(
  page = 0,
  size = 20,
  signal?: AbortSignal,
): Promise<PageResponse<SpotListItem>> {
  return apiFetch<PageResponse<SpotListItem>>("/api/v1/users/me/likes", {
    searchParams: { page, size },
    signal,
  });
}
