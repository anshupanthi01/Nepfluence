/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Bell,
  Boxes,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  CreditCard,
  FileText,
  Globe,
  IndianRupee,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Megaphone,
  MoreHorizontal,
  PlayCircle,
  Plus,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Upload,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react"
import { FormEvent, ReactNode, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  MarketplaceApplication as Application,
  MarketplaceCampaign as Campaign,
  MarketplaceCollaboration as Collaboration,
  ApplicationStatus,
  useMarketplaceStore,
} from "@/features/shared/marketplaceStore"
import {
  type Activity,
  type Creator,
  creatorAnalytics,
  creatorImage,
  creatorWorkSamples,
  campaignImage,
  money,
  statusClass,
} from "../brand-dashboard.shared"

export function CampaignList({
  campaigns,
  onPublish,
  onCreate,
  onManage,
  compact = false,
}: {
  campaigns: Campaign[]
  onPublish: (id: number) => void
  onCreate?: () => void
  onManage?: (title: string) => void
  compact?: boolean
}) {
  return (
    <section className="rounded-[8px] border border-[#e4e7f1] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#edf0f6] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black">Campaigns</h2>
          <p className="mt-1 text-sm font-medium text-[#727887]">Draft, publish, pause, and track creator application flow.</p>
        </div>
        {onCreate && (
          <Button className="h-10 rounded-[8px] bg-[#6174f8] px-4 text-sm font-black text-white hover:bg-[#5268df]" type="button" onClick={onCreate}>
            <Plus className="size-4" aria-hidden="true" />
            New campaign
          </Button>
        )}
      </div>

      <div className="grid gap-4 p-5">
        {campaigns.map((campaign) => (
          <article key={campaign.id} className="grid overflow-hidden rounded-[8px] border border-[#edf0f6] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(43,48,79,0.1)] xl:grid-cols-[210px_1fr]">
            <div className="relative min-h-40 bg-cover bg-center" style={{ backgroundImage: `url(${campaignImage(campaign)})` }}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/62 via-black/10 to-transparent" />
              <span className={`absolute left-4 top-4 rounded-full px-2.5 py-1 text-xs font-black ${statusClass(campaign.status)}`}>{campaign.status}</span>
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-xs font-black uppercase text-white/72">{campaign.niche} - {campaign.platform}</p>
                <h3 className="mt-1 text-lg font-black text-white">{campaign.title}</h3>
              </div>
            </div>
            <div className="grid gap-3 p-4 xl:grid-cols-[1fr_120px_140px_130px] xl:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-black">{campaign.title}</h3>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-black ${statusClass(campaign.status)}`}>{campaign.status}</span>
                </div>
                <p className="mt-1.5 text-sm font-medium leading-5 text-[#697080]">{campaign.brief}</p>
                {!compact && (
                  <div className="mt-2.5 flex flex-wrap gap-2 text-xs font-black text-[#697080]">
                    <span className="rounded-full bg-[#f3f5fb] px-2.5 py-1">{campaign.niche}</span>
                    <span className="rounded-full bg-[#f3f5fb] px-2.5 py-1">{campaign.platform}</span>
                    <span className="rounded-full bg-[#f3f5fb] px-2.5 py-1">{campaign.country}</span>
                  </div>
                )}
              </div>
              <div>
                <div className="text-xs font-black uppercase text-[#9aa0ad]">Budget</div>
                <div className="mt-1 text-sm font-black">{money(campaign.budget)}</div>
              </div>
              <div>
                <div className="text-xs font-black uppercase text-[#9aa0ad]">Pipeline</div>
                <div className="mt-1 text-sm font-black">{campaign.applications} apps / {campaign.accepted} accepted</div>
              </div>
              <div className="flex gap-2 xl:justify-end">
                {campaign.status === "DRAFT" ? (
                  <Button className="h-9 rounded-[8px] bg-[#17171f] px-3 text-sm font-black text-white hover:bg-[#262636]" type="button" onClick={() => onPublish(campaign.id)}>
                    Publish
                  </Button>
                ) : (
                  <Button className="h-9 rounded-[8px] px-3 text-sm font-black text-[#555866]" variant="outline" type="button" onClick={() => onManage?.(campaign.title)}>
                    Manage
                  </Button>
                )}
                <button className="grid size-9 place-items-center rounded-[8px] border border-[#e1e4ef]" type="button" aria-label="More campaign actions">
                  <MoreHorizontal className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}