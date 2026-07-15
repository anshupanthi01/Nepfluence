import type { BadgeTone } from "@/components/ui/status-badge"
import type { AdminCollaborationState, AdminEscrowStatus, AdminLedgerType } from "@/features/admin/types/admin.types"

export const COLLABORATION_STATE_TONE: Record<AdminCollaborationState, BadgeTone> = {
  escrow_pending: "neutral",
  in_progress: "info",
  submitted: "warning",
  approved: "positive",
  paused: "warning",
  disputed: "negative",
  cancelled: "negative",
}

export const ESCROW_STATUS_TONE: Record<AdminEscrowStatus, BadgeTone> = {
  pending: "neutral",
  held: "info",
  released: "positive",
}

export const LEDGER_TYPE_TONE: Record<AdminLedgerType, BadgeTone> = {
  escrow_deposit: "info",
  payout_release: "positive",
  refund: "negative",
  partial_refund: "warning",
  adjustment_debit: "negative",
  adjustment_credit: "positive",
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount)
}

export function formatFeeLine(amount: number, percent: number): string {
  return `${formatCurrency(amount)} (${percent}%)`
}
