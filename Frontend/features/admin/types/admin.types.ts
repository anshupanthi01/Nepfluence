export type AdminStaffRole = "super_admin" | "finance_ops" | "support" | "content_moderator" | "analyst"

export type AdminModule =
  | "users"
  | "staff"
  | "campaigns"
  | "escrow"
  | "analytics"
  | "disputes"
  | "moderation"
  | "settings"
  | "audit_log"

export type Page<T> = {
  items: T[]
  page: number
  page_size: number
  total: number
}

export type AdminMe = {
  staff_role: AdminStaffRole
  allowed_modules: AdminModule[]
  must_change_password: boolean
}

export type BackendUserRole = "brand" | "influencer" | "admin"

export type AdminUserListItem = {
  id: number
  username: string
  email: string
  role: BackendUserRole
  staff_role: AdminStaffRole | null
  is_active: boolean
  date_joined: string
  last_login: string | null
}

export type AdminUserDetail = AdminUserListItem & {
  profile_type: "brand" | "influencer" | null
  profile_summary: string | null
}

export type AdminStaffListItem = {
  admin_profile_id: number
  user_id: number
  username: string
  email: string
  staff_role: AdminStaffRole
  is_active: boolean
  created_at: string
}

export type AdminCampaignStatus =
  | "draft"
  | "published"
  | "closed"
  | "completed"
  | "in_review"
  | "disputed"

export type AdminCampaignListItem = {
  id: number
  title: string
  brand_name: string
  status: AdminCampaignStatus
  budget_min: number
  budget_max: number
  niche: string | null
  country: string | null
  deadline: string | null
}

export type AdminCampaignDetail = AdminCampaignListItem & {
  description: string | null
  platform: string | null
  date_posted: string
  proposals_count: number
  collaborations_count: number
}

export type AdminCollaborationState =
  | "escrow_pending"
  | "in_progress"
  | "submitted"
  | "approved"
  | "paused"
  | "disputed"
  | "cancelled"

export type AdminEscrowStatus = "pending" | "held" | "released"

export type AdminLedgerType =
  | "escrow_deposit"
  | "payout_release"
  | "refund"
  | "partial_refund"
  | "adjustment_debit"
  | "adjustment_credit"

export type AdminCollaborationListItem = {
  campaign_title: string
  brand_name: string
  creator_name: string
  id: number
  state: AdminCollaborationState
  escrow_status: AdminEscrowStatus
  payout_amount: number
  created_at: string
}

export type AdminLedgerEntry = {
  id: number
  type: AdminLedgerType
  amount: number
  from_user_id: number | null
  to_user_id: number | null
  created_at: string
}

export type AdminCollaborationDetail = AdminCollaborationListItem & {
  ledger_entries: AdminLedgerEntry[]
  platform_fee_percent: number
  platform_fee_amount: number
  tds_rate_percent: number
  tds_amount: number
  net_payout: number
}

export type PayoutQueueItem = {
  collaboration_id: number
  campaign_title: string
  brand_name: string
  creator_name: string
  gross_amount: number
  platform_fee_percent: number
  platform_fee_amount: number
  tds_rate_percent: number
  tds_amount: number
  net_payout: number
}

export type AdminAuditLogEntry = {
  id: number
  actor_username: string
  action: string
  module: string
  target_type: string
  target_id: number
  reason: string | null
  before_state: string | null
  after_state: string | null
  created_at: string
}
