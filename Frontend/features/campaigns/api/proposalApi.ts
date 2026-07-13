"use client"

import { apiClient } from "@/lib/api-client"

export type ProposalStatus = "pending" | "accepted" | "rejected" | "withdrawn"

export type ProposalCreatorSummary = {
  id: number
  user_id: number
  full_name: string
  handle: string
  niche: string
  country: string
  followers: string
}

export type ProposalCampaignSummary = {
  id: number
  title: string
  brand_name: string
  status: "draft" | "published" | "closed" | "completed"
  budget_min: number
  budget_max: number
}

export type Proposal = {
  id: number
  campaign_id: number
  influencer_profile_id: number
  message: string | null
  proposed_budget: number | null
  status: ProposalStatus
  created_at: string
  updated_at: string
  creator: ProposalCreatorSummary | null
  campaign: ProposalCampaignSummary | null
}

export type ProposalPayload = {
  message?: string
  proposed_budget?: number
}

export function sendProposal(campaignId: number, payload: ProposalPayload = {}) {
  return apiClient<Proposal>(`/proposals/campaigns/${campaignId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function listMyProposals() {
  return apiClient<Proposal[]>("/proposals/me")
}

export function withdrawProposal(id: number) {
  return apiClient<Proposal>(`/proposals/${id}/withdraw`, { method: "POST" })
}

export function listCampaignProposals(campaignId: number) {
  return apiClient<Proposal[]>(`/proposals/campaigns/${campaignId}`)
}

export function acceptProposal(id: number) {
  return apiClient<Proposal>(`/proposals/${id}/accept`, { method: "POST" })
}

export function rejectProposal(id: number) {
  return apiClient<Proposal>(`/proposals/${id}/reject`, { method: "POST" })
}
