"use client"

import { apiClient } from "@/lib/api-client"

export type CollaborationState = "escrow_pending" | "in_progress" | "submitted" | "approved"
export type EscrowStatus = "pending" | "held" | "released"
export type LedgerType = "escrow_deposit" | "payout_release"

export type CollaborationCreatorSummary = {
  id: number
  user_id: number
  full_name: string
  handle: string
  niche: string
  country: string
  followers: string
}

export type CollaborationCampaignSummary = {
  id: number
  title: string
  brand_name: string
  status: "draft" | "published" | "closed" | "completed"
  budget_min: number
  budget_max: number
}

export type DeliverableSubmission = {
  id: number
  video_url: string
  post_url: string | null
  caption: string | null
  notes: string | null
  aspect_ratio: string | null
  duration: string | null
  brief_matched: boolean
  usage_rights: boolean
  no_copyright_music: boolean
  submitted_at: string
}

export type DeliverableSubmissionPayload = {
  video_url: string
  post_url?: string
  caption?: string
  notes?: string
  aspect_ratio?: string
  duration?: string
  brief_matched?: boolean
  usage_rights?: boolean
  no_copyright_music?: boolean
}

export type Collaboration = {
  id: number
  proposal_id: number
  state: CollaborationState
  escrow_status: EscrowStatus
  payout_amount: number
  created_at: string
  updated_at: string
  creator: CollaborationCreatorSummary | null
  campaign: CollaborationCampaignSummary | null
  submission: DeliverableSubmission | null
}

export type Wallet = {
  balance: number
  escrow_held: number
  released: number
}

export type LedgerEntry = {
  id: number
  collaboration_id: number
  from_user_id: number | null
  to_user_id: number | null
  type: LedgerType
  amount: number
  created_at: string
}

export function listMyCollaborations() {
  return apiClient<Collaboration[]>("/collaborations/me")
}

export function depositEscrow(collaborationId: number) {
  return apiClient<Collaboration>(`/collaborations/${collaborationId}/deposit-escrow`, { method: "POST" })
}

export function submitDeliverable(collaborationId: number, payload: DeliverableSubmissionPayload) {
  return apiClient<Collaboration>(`/collaborations/${collaborationId}/submissions`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function approveDeliverable(collaborationId: number) {
  return apiClient<Collaboration>(`/collaborations/${collaborationId}/approve`, { method: "POST" })
}

export function getWallet() {
  return apiClient<Wallet>("/wallet/me")
}

export function getLedger() {
  return apiClient<LedgerEntry[]>("/ledger/me")
}
