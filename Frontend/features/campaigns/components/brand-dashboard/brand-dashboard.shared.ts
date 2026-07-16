"use client"

import {
  Boxes,
  Building2,
  ClipboardList,
  CreditCard,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Megaphone,
  UsersRound,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import {
  MarketplaceCampaign as Campaign,
} from "@/features/shared/marketplaceStore"
export type Section =
  | "Dashboard"
  | "Campaigns"
  | "Applications"
  | "Collaborations"
  | "Messages"
  | "Discover Creators"
  | "Payments"
  | "Brand Profile"
  | "Trust & Reports"

export type Activity = {
  id: number
  message: string
  tone: "blue" | "green" | "amber" | "red"
}

export const navItems: { label: Section; icon: LucideIcon }[] = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Campaigns", icon: Megaphone },
  { label: "Applications", icon: ClipboardList },
  { label: "Collaborations", icon: Boxes },
  { label: "Messages", icon: MessageSquare },
  { label: "Discover Creators", icon: UsersRound },
  { label: "Payments", icon: CreditCard },
  { label: "Brand Profile", icon: Building2 },
  { label: "Trust & Reports", icon: FileText },
]

export type Creator = {
  name: string
  handle: string
  country: "NP" | "IN"
  niche: string
  followers: string
  rating: string
  image: string
  platforms?: string[]
  // Track 1 (discovery ingestion): false for creators found via TikHub/YouTube search who
  // haven't signed up to Nepfluence - undefined/true for real onboarded profiles.
  isOnboarded?: boolean
  // ISO timestamp from discovery_creators.last_scraped_at - only set for scraped cards, so
  // the UI can label them "as of <date>, unverified estimate" per the plan's legal-labeling
  // rule (never let a brand mistake a scraped estimate for verified data).
  statsAsOf?: string
}

export const creators: Creator[] = []

export const creatorWorkSamples: {
  title: string
  creator: string
  platform: string
  metric: string
  image: string
}[] = []

export const creatorAnalytics: Record<string, {
  engagementRate: string
  avgViews: string
  avgLikes: string
  monthlyReach: string
  saves: string
  completionRate: string
  responseTime: string
  audience: { label: string; value: string }[]
  age: { label: string; value: string }[]
}> = {}

export const initialCampaigns: Campaign[] = []

export const lifecycleSteps = [
  "Create campaign as DRAFT",
  "Publish campaign as PUBLISHED",
  "Influencers apply in PENDING state",
  "Accept creator and lock campaign brief",
  "Deposit escrow to unlock chat",
  "Review deliverables and request revision if needed",
  "Approve work and release payment",
]

export const emptyCampaignForm = {
  title: "",
  niche: "",
  budget: "",
  country: "" as "" | "NP" | "IN",
  platform: "",
  deadline: "",
  brief: "",
}

export function money(value: number) {
  return `NPR ${value.toLocaleString("en-IN")}`
}

export function campaignImage(campaign: Pick<Campaign, "niche" | "title">) {
  const key = `${campaign.niche} ${campaign.title}`.toLowerCase()

  if (key.includes("food") || key.includes("momo")) {
    return "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=760&q=80"
  }

  if (key.includes("tea") || key.includes("lifestyle")) {
    return "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=760&q=80"
  }

  return "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=760&q=80"
}

export function creatorImage(handle: string) {
  return creators.find((creator) => creator.handle === handle)?.image ?? "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=320&q=80"
}

export function statusClass(status: string) {
  if (["PUBLISHED", "HELD", "IN_PROGRESS", "ACCEPTED", "APPROVED", "RELEASED"].includes(status)) {
    return "bg-[#e9f8ef] text-[#16864f]"
  }
  if (["DRAFT", "PENDING", "ESCROW_PENDING", "SUBMITTED"].includes(status)) {
    return "bg-[#fff5df] text-[#9b6500]"
  }
  if (["PAUSED", "REJECTED"].includes(status)) {
    return "bg-[#fff0f0] text-[#b83232]"
  }
  return "bg-[#f0ece5] text-[#505852]"
}
