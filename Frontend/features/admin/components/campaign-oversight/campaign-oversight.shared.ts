import type { BadgeTone } from "@/components/ui/status-badge"
import type { AdminCampaignStatus } from "@/features/admin/types/admin.types"

export const CAMPAIGN_STATUS_TONE: Record<AdminCampaignStatus, BadgeTone> = {
  draft: "neutral",
  published: "positive",
  closed: "neutral",
  completed: "positive",
  in_review: "warning",
  disputed: "negative",
}

export const CAMPAIGN_STATUS_OPTIONS: AdminCampaignStatus[] = [
  "draft",
  "published",
  "closed",
  "completed",
  "in_review",
  "disputed",
]
