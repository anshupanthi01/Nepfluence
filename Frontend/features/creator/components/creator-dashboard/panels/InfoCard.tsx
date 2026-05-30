/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import Link from "next/link"
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  BriefcaseBusiness,
  Camera,
  CheckCircle2,
  Clock3,
  CreditCard,
  Edit3,
  Eye,
  FileText,
  Heart,
  IndianRupee,
  LayoutDashboard,
  Menu,
  MessageSquare,
  PlayCircle,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Upload,
  UserRound,
  WalletCards,
  X,
} from "lucide-react"
import { FormEvent, ReactNode, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  CampaignStatus,
  DeliverableSubmission,
  MarketplaceCampaign,
  MarketplaceCollaboration,
  useMarketplaceStore,
} from "@/features/shared/marketplaceStore"
import {
  type Activity,
  type Collaboration,
  type CreatorCampaign,
  creatorAnalytics,
  creatorProfileImage,
  portfolioShots,
  campaignImage,
  money,
  statusClass,
} from "../creator-dashboard.shared"

export function InfoCard({ icon: Icon, title, body }: { icon: typeof LayoutDashboard; title: string; body: ReactNode }) {
  return (
    <div className="rounded-[8px] border border-[#edf0f6] p-4">
      <span className="grid size-9 place-items-center rounded-[8px] bg-[#eef1ff] text-[#6174f8]">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <h3 className="mt-4 font-black">{title}</h3>
      <p className="mt-2 text-sm font-bold leading-6 text-[#606675]">{body}</p>
    </div>
  )
}