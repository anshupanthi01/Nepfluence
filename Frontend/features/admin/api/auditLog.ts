import { apiClient } from "@/lib/api-client"
import { buildQuery } from "@/features/admin/api/shared"
import type { AdminAuditLogEntry, Page } from "@/features/admin/types/admin.types"

export type ListAuditLogParams = {
  module?: string
  action?: string
  target_type?: string
  page?: number
  page_size?: number
}

export function listAuditLog(params: ListAuditLogParams = {}) {
  return apiClient<Page<AdminAuditLogEntry>>(`/api/admin/audit-log${buildQuery(params)}`)
}
