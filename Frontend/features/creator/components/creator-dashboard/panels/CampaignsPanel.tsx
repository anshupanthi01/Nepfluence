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

export function CampaignsPanel({
  campaigns,
  search,
  onSearch,
  onApply,
  onWithdraw,
  compact = false,
}: {
  campaigns: CreatorCampaign[]
  search: string
  onSearch: (search: string) => void
  onApply: (id: number) => void
  onWithdraw: (id: number) => void
  compact?: boolean
}) {
  return (
    <section className="rounded-[8px] border border-[#e4e7f1] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#edf0f6] p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-black">{compact ? "Recommended campaigns" : "Find Campaigns"}</h2>
          <p className="mt-1 text-sm font-medium text-[#727887]">Apply to brand campaigns that match your profile and content category.</p>
        </div>
        <label className="flex items-center gap-2 rounded-[8px] border border-[#e1e4ef] px-3 py-2 text-sm font-bold text-[#727887]">
          <Search className="size-4" aria-hidden="true" />
          <input
            className="w-full bg-transparent text-sm font-bold outline-none placeholder:text-[#727887]"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search campaign, niche, brand"
          />
        </label>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
        {campaigns.map((campaign) => (
          <article key={campaign.id} className="overflow-hidden rounded-[8px] border border-[#e7e9f2] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(43,48,79,0.12)]">
            <div className="flex items-center justify-between gap-2 border-b border-[#edf0f6] p-2.5">
              <div className="flex min-w-0 items-center gap-2">
                <div className="grid size-8 shrink-0 place-items-center rounded-full bg-[#111322] text-xs font-black text-white">
                  {campaign.brand.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-black text-[#17171f]">{campaign.brand}</h3>
                  <p className="truncate text-xs font-bold text-[#727887]">{campaign.platform} - {campaign.country}</p>
                </div>
              </div>
              <span className="rounded-full bg-[#eef1ff] px-2 py-0.5 text-[11px] font-black text-[#6174f8]">{campaign.match}%</span>
            </div>

            <div className="relative aspect-[4/3] bg-cover bg-center" style={{ backgroundImage: `url(${campaignImage(campaign)})` }}>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent p-4">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-black ${statusClass(campaign.status)}`}>{campaign.status.replace("_", " ")}</span>
                <h2 className="mt-1.5 line-clamp-2 text-base font-black leading-5 text-white">{campaign.title}</h2>
              </div>
            </div>

            <div className="p-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex gap-2">
                  <button className="grid size-8 place-items-center rounded-full border border-[#e1e4ef] text-[#17171f]" type="button" aria-label="Like campaign">
                    <Heart className="size-3.5" aria-hidden="true" />
                  </button>
                  <button className="grid size-8 place-items-center rounded-full border border-[#e1e4ef] text-[#17171f]" type="button" aria-label="Message brand">
                    <MessageSquare className="size-3.5" aria-hidden="true" />
                  </button>
                  <button className="grid size-8 place-items-center rounded-full border border-[#e1e4ef] text-[#17171f]" type="button" aria-label="Share campaign">
                    <Send className="size-3.5" aria-hidden="true" />
                  </button>
                </div>
                <p className="text-xs font-black text-[#17171f]">{money(campaign.budget)}</p>
              </div>

              <p className="mt-2 line-clamp-2 text-xs font-bold leading-5 text-[#17171f]">
                <span className="font-black">{campaign.brand}</span>{" "}
                <span className="font-medium text-[#555866]">{campaign.brief}</span>
              </p>

              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-black text-[#697080]">
                <span className="rounded-full bg-[#f3f5fb] px-2 py-0.5">{campaign.niche}</span>
                <span className="rounded-full bg-[#f3f5fb] px-2 py-0.5">{Math.round(campaign.reach / 1000)}K reach</span>
                <span className="rounded-full bg-[#f3f5fb] px-2 py-0.5">{campaign.deadline}</span>
              </div>

              <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-2">
                {campaign.status === "NOT_APPLIED" && (
                  <Button className="h-8 rounded-[8px] bg-[#6174f8] px-3 text-xs font-black text-white hover:bg-[#5268df]" type="button" onClick={() => onApply(campaign.id)}>
                    Apply now
                  </Button>
                )}
                {campaign.status === "PENDING" && (
                  <Button className="h-8 rounded-[8px] border-[#f0d89f] px-3 text-xs font-black text-[#9b6500]" variant="outline" type="button" onClick={() => onWithdraw(campaign.id)}>
                    Withdraw
                  </Button>
                )}
                {campaign.status === "ACCEPTED" && (
                  <span className="inline-flex h-8 items-center justify-center rounded-[8px] bg-[#e9f8ef] px-3 text-xs font-black text-[#16864f]">Accepted</span>
                )}
                <Button className="h-8 rounded-[8px] px-2.5 text-xs font-black text-[#555866]" variant="outline" type="button">
                  Details
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}