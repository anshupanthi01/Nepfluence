"use client"

import {
  BriefcaseBusiness,
  CreditCard,
  LayoutDashboard,
  MessageSquare,
  Search,
  Send,
  UserRound,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import {
  CampaignStatus,
  DeliverableSubmission,
  MarketplaceCampaign,
  MarketplaceCollaboration,
} from "@/features/shared/marketplaceStore"
export type Section = "Dashboard" | "Find Campaigns" | "Applications" | "Collaborations" | "Messages" | "Payouts" | "Profile"
export type CreatorApplicationStatus = "NOT_APPLIED" | "PENDING" | "ACCEPTED" | "REJECTED"
export type CreatorCampaign = Omit<MarketplaceCampaign, "status"> & {
  campaignStatus: CampaignStatus
  match: number
  status: CreatorApplicationStatus
}
export type Collaboration = MarketplaceCollaboration

export type Activity = {
  id: number
  message: string
  tone: "blue" | "green" | "amber"
}

export type CreatorWorkspaceProfile = {
  profileId?: number
  creator: string
  handle: string
  country: "NP" | "IN"
  niche: string
  followers: string
  bio: string
  location: string
  connectedPlatforms: string[]
  analytics: { label: string; value: string; detail: string }[]
}

export const emptySubmissionForm: Omit<DeliverableSubmission, "submittedAt"> = {
  videoUrl: "",
  postUrl: "",
  caption: "",
  notes: "",
  aspectRatio: "9:16",
  duration: "30s",
  checklist: {
    briefMatched: true,
    usageRights: true,
    noCopyrightMusic: true,
  },
}

export const navItems: { label: Section; icon: LucideIcon }[] = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Find Campaigns", icon: Search },
  { label: "Applications", icon: BriefcaseBusiness },
  { label: "Collaborations", icon: MessageSquare },
  { label: "Messages", icon: Send },
  { label: "Payouts", icon: CreditCard },
  { label: "Profile", icon: UserRound },
]

export function campaignImage(campaign: Pick<MarketplaceCampaign, "niche" | "title">) {
  const key = `${campaign.niche} ${campaign.title}`.toLowerCase()

  if (key.includes("food") || key.includes("momo")) {
    return "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=760&q=80"
  }

  if (key.includes("tea") || key.includes("lifestyle")) {
    return "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=760&q=80"
  }

  return "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=760&q=80"
}

export function money(value: number) {
  return `NPR ${value.toLocaleString("en-IN")}`
}

export function statusClass(status: string) {
  if (["ACCEPTED", "APPROVED", "PAID", "HELD", "RELEASED", "IN_PROGRESS"].includes(status)) {
    return "bg-[#e9f8ef] text-[#16864f]"
  }
  if (["PENDING", "ESCROW_PENDING", "SUBMITTED"].includes(status)) {
    return "bg-[#fff5df] text-[#9b6500]"
  }
  if (status === "REJECTED") {
    return "bg-[#fff0f0] text-[#b83232]"
  }
  return "bg-[#eef1ff] text-[#6070e8]"
}
