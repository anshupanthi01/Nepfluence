import { apiClient } from "@/lib/api-client"
import { buildQuery } from "@/features/admin/api/shared"
import type {
  AdminCampaignDetail,
  AdminCampaignListItem,
  AdminCampaignStatus,
  Page,
} from "@/features/admin/types/admin.types"

export type ListCampaignsParams = {
  status?: AdminCampaignStatus
  brand_id?: number
  q?: string
  page?: number
  page_size?: number
}

export function listCampaigns(params: ListCampaignsParams = {}) {
  return apiClient<Page<AdminCampaignListItem>>(`/api/admin/campaigns${buildQuery(params)}`)
}

export function getCampaign(campaignId: number) {
  return apiClient<AdminCampaignDetail>(`/api/admin/campaigns/${campaignId}`)
}

export function setCampaignStatus(campaignId: number, status: AdminCampaignStatus, reason: string) {
  return apiClient<AdminCampaignListItem>(`/api/admin/campaigns/${campaignId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, reason }),
  })
}
