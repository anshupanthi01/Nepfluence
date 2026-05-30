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

export function ApplicationsPanel({ campaigns, onWithdraw }: { campaigns: CreatorCampaign[]; onWithdraw: (id: number) => void }) {
  const applications = campaigns.filter((campaign) => campaign.status !== "NOT_APPLIED")

  return (
    <section className="rounded-[8px] border border-[#e4e7f1] bg-white shadow-sm">
      <div className="border-b border-[#edf0f6] p-5">
        <h2 className="text-xl font-black">Applications</h2>
        <p className="mt-1 text-sm font-medium text-[#727887]">Track submitted, accepted, and rejected brand applications.</p>
      </div>
      <div className="grid gap-3 p-5">
        {applications.map((campaign) => (
          <article key={campaign.id} className="flex flex-col gap-3 rounded-[8px] border border-[#edf0f6] p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-black">{campaign.title}</h3>
              <p className="mt-1 text-sm font-bold text-[#727887]">{campaign.brand} - {campaign.platform}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-xs font-black ${statusClass(campaign.status)}`}>{campaign.status}</span>
              {campaign.status === "PENDING" && (
                <button className="h-9 rounded-[8px] border border-[#f0d89f] px-3 text-sm font-black text-[#9b6500]" type="button" onClick={() => onWithdraw(campaign.id)}>
                  Withdraw
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}