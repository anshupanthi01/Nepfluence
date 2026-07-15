import { apiClient } from "@/lib/api-client"
import { buildQuery } from "@/features/admin/api/shared"
import type {
  AdminCollaborationDetail,
  AdminCollaborationListItem,
  AdminCollaborationState,
  AdminEscrowStatus,
  Page,
  PayoutQueueItem,
} from "@/features/admin/types/admin.types"

export type ListCollaborationsParams = {
  escrow_status?: AdminEscrowStatus
  state?: AdminCollaborationState
  q?: string
  page?: number
  page_size?: number
}

export function listCollaborations(params: ListCollaborationsParams = {}) {
  return apiClient<Page<AdminCollaborationListItem>>(`/api/admin/escrow/collaborations${buildQuery(params)}`)
}

export function getCollaboration(collaborationId: number) {
  return apiClient<AdminCollaborationDetail>(`/api/admin/escrow/collaborations/${collaborationId}`)
}

export function listPayoutQueue(params: { page?: number; page_size?: number } = {}) {
  return apiClient<Page<PayoutQueueItem>>(`/api/admin/escrow/payout-queue${buildQuery(params)}`)
}

function reasonedAction(collaborationId: number, action: string, reason: string) {
  return apiClient<AdminCollaborationListItem>(`/api/admin/escrow/collaborations/${collaborationId}/${action}`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  })
}

export function pauseCollaboration(collaborationId: number, reason: string) {
  return reasonedAction(collaborationId, "pause", reason)
}

export function resumeCollaboration(collaborationId: number, reason: string) {
  return reasonedAction(collaborationId, "resume", reason)
}

export function flagDispute(collaborationId: number, reason: string) {
  return reasonedAction(collaborationId, "flag-dispute", reason)
}

export function refundCollaboration(collaborationId: number, amount: number, reason: string) {
  return apiClient<AdminCollaborationListItem>(`/api/admin/escrow/collaborations/${collaborationId}/refund`, {
    method: "POST",
    body: JSON.stringify({ amount, reason }),
  })
}

export function adjustCollaboration(
  collaborationId: number,
  type: "credit" | "debit",
  amount: number,
  reason: string
) {
  return apiClient<AdminCollaborationListItem>(`/api/admin/escrow/collaborations/${collaborationId}/adjust`, {
    method: "POST",
    body: JSON.stringify({ type, amount, reason }),
  })
}
