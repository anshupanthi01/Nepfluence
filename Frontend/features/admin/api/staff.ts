import { apiClient } from "@/lib/api-client"
import { buildQuery } from "@/features/admin/api/shared"
import type { AdminStaffListItem, AdminStaffRole, Page } from "@/features/admin/types/admin.types"

export function listStaff(params: { page?: number; page_size?: number } = {}) {
  return apiClient<Page<AdminStaffListItem>>(`/api/admin/staff${buildQuery(params)}`)
}

export function createStaff(input: {
  username: string
  email: string
  password: string
  staff_role: AdminStaffRole
}) {
  return apiClient<AdminStaffListItem>("/api/admin/staff", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function updateStaff(
  adminProfileId: number,
  input: { staff_role?: AdminStaffRole; is_active?: boolean; reason: string }
) {
  return apiClient<AdminStaffListItem>(`/api/admin/staff/${adminProfileId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  })
}
