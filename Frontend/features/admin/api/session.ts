import { apiClient } from "@/lib/api-client"
import type { AdminMe } from "@/features/admin/types/admin.types"

export function getAdminMe() {
  return apiClient<AdminMe>("/api/admin/me")
}

export function changeAdminPassword(currentPassword: string, newPassword: string) {
  return apiClient<{ message: string }>("/api/users/me/password", {
    method: "PATCH",
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  })
}
