import type { PageResponse } from "@/types/api";
import type { AdminSpotItem, AdminUserItem } from "@/types/admin";
import type { SpotDetail, SpotRequest, VerificationStatus } from "@/types/spot";
import { apiFetch } from "@/lib/api/client";

export async function fetchAdminSpots(
  params: {
    status?: VerificationStatus;
    page?: number;
    size?: number;
  } = {},
  signal?: AbortSignal,
): Promise<PageResponse<AdminSpotItem>> {
  return apiFetch<PageResponse<AdminSpotItem>>("/api/v1/admin/sacred-spots", {
    searchParams: { ...params },
    signal,
  });
}

export async function fetchPendingSpots(
  page = 0,
  size = 20,
  signal?: AbortSignal,
): Promise<PageResponse<AdminSpotItem>> {
  return apiFetch<PageResponse<AdminSpotItem>>(
    "/api/v1/admin/sacred-spots/pending",
    { searchParams: { page, size }, signal },
  );
}

export async function fetchAdminSpotDetail(
  id: number,
  signal?: AbortSignal,
): Promise<SpotDetail> {
  return apiFetch<SpotDetail>(`/api/v1/admin/sacred-spots/${id}`, { signal });
}

export async function verifySpot(id: number): Promise<void> {
  await apiFetch<void>(`/api/v1/admin/sacred-spots/${id}/verify`, {
    method: "PATCH",
  });
}

export async function rejectSpot(id: number, reason: string): Promise<void> {
  await apiFetch<void>(`/api/v1/admin/sacred-spots/${id}/reject`, {
    method: "PATCH",
    body: { reason },
  });
}

export async function updateSpotAsAdmin(
  id: number,
  request: SpotRequest,
): Promise<SpotDetail> {
  return apiFetch<SpotDetail>(`/api/v1/admin/sacred-spots/${id}`, {
    method: "PUT",
    body: request,
  });
}

export async function deleteSpotAsAdmin(id: number): Promise<void> {
  await apiFetch<void>(`/api/v1/admin/sacred-spots/${id}`, {
    method: "DELETE",
  });
}

export async function fetchAdminUsers(
  page = 0,
  size = 20,
  signal?: AbortSignal,
): Promise<PageResponse<AdminUserItem>> {
  return apiFetch<PageResponse<AdminUserItem>>("/api/v1/admin/users", {
    searchParams: { page, size },
    signal,
  });
}

export async function unlockUser(id: number): Promise<void> {
  await apiFetch<void>(`/api/v1/admin/users/${id}/unlock`, { method: "POST" });
}

export async function updateUserEnabled(
  id: number,
  enabled: boolean,
): Promise<void> {
  await apiFetch<void>(`/api/v1/admin/users/${id}/enabled`, {
    method: "PATCH",
    body: { enabled },
  });
}
