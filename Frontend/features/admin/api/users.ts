import { apiClient } from "@/lib/api-client"
import { buildQuery } from "@/features/admin/api/shared"
import type { AdminUserDetail, AdminUserListItem, BackendUserRole, Page } from "@/features/admin/types/admin.types"

export type ListUsersParams = {
  role?: BackendUserRole
  is_active?: boolean
  q?: string
  page?: number
  page_size?: number
}

export function listUsers(params: ListUsersParams = {}) {
  return apiClient<Page<AdminUserListItem>>(`/api/admin/users${buildQuery(params)}`)
}

export function getUser(userId: number) {
  return apiClient<AdminUserDetail>(`/api/admin/users/${userId}`)
}

export function setUserActive(userId: number, isActive: boolean, reason: string) {
  return apiClient<AdminUserListItem>(`/api/admin/users/${userId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ is_active: isActive, reason }),
  })
}
