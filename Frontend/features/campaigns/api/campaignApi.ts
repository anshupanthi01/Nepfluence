"use client"

import { apiClient } from "@/lib/api-client"

export type CampaignStatus = "draft" | "published" | "closed" | "completed"

export type Campaign = {
  id: number
  brand_profile_id: number
  brand_name: string
  title: string
  description: string | null
  budget_min: number
  budget_max: number
  niche: string | null
  country: "NP" | "IN" | null
  platform: string | null
  deadline: string | null
  status: CampaignStatus
  image_file: string | null
  image_path: string
}

export type CampaignPayload = {
  title: string
  description?: string
  budget_min: number
  budget_max: number
  niche?: string
  country?: "NP" | "IN"
  platform?: string
  deadline?: string
}

export function listMyCampaigns(params: { skip?: number; limit?: number } = {}) {
  const query = new URLSearchParams()
  if (params.skip) query.set("skip", String(params.skip))
  if (params.limit) query.set("limit", String(params.limit))
  const suffix = query.toString() ? `?${query.toString()}` : ""
  return apiClient<Campaign[]>(`/campaigns/me${suffix}`)
}

export function createCampaign(payload: CampaignPayload) {
  return apiClient<Campaign>("/campaigns/me", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function updateCampaign(id: number, payload: Partial<CampaignPayload>) {
  return apiClient<Campaign>(`/campaigns/me/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

export function publishCampaign(id: number) {
  return apiClient<Campaign>(`/campaigns/me/${id}/publish`, { method: "POST" })
}

export function closeCampaign(id: number) {
  return apiClient<Campaign>(`/campaigns/me/${id}/close`, { method: "POST" })
}

export function completeCampaign(id: number) {
  return apiClient<Campaign>(`/campaigns/me/${id}/complete`, { method: "POST" })
}

export function deleteCampaign(id: number) {
  return apiClient<void>(`/campaigns/me/${id}`, { method: "DELETE" })
}

export function uploadCampaignPicture(id: number, file: File) {
  const formData = new FormData()
  formData.append("file", file)
  return apiClient<Campaign>(`/campaigns/me/${id}/picture`, {
    method: "PATCH",
    body: formData,
  })
}

export function deleteCampaignPicture(id: number) {
  return apiClient<Campaign>(`/campaigns/me/${id}/picture`, { method: "DELETE" })
}

export function listPublishedCampaigns(params: { skip?: number; limit?: number } = {}) {
  const query = new URLSearchParams()
  if (params.skip) query.set("skip", String(params.skip))
  if (params.limit) query.set("limit", String(params.limit))
  const suffix = query.toString() ? `?${query.toString()}` : ""
  return apiClient<Campaign[]>(`/campaigns/${suffix}`, { auth: false })
}

export function getPublishedCampaign(id: number) {
  return apiClient<Campaign>(`/campaigns/${id}`, { auth: false })
}
