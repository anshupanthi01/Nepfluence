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

export function ApplicationQueue({
  applications,
  campaigns,
  onReview,
  showResolved = false,
}: {
  applications: Application[]
  campaigns: Campaign[]
  onReview: (id: number, status: ApplicationStatus) => void
  showResolved?: boolean
}) {
  const visibleApplications = showResolved ? applications : applications.filter((application) => application.status === "PENDING")

  return (
    <section className="rounded-[8px] border border-[#e4e7f1] bg-white shadow-sm">
      <div className="border-b border-[#edf0f6] p-5">
        <h2 className="text-xl font-black">Applications</h2>
        <p className="mt-1 text-sm font-medium text-[#727887]">Accepting a creator triggers escrow and creates a collaboration room.</p>
      </div>
      <div className="divide-y divide-[#edf0f6]">
        {visibleApplications.map((application) => (
          <article key={application.id} className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 gap-3">
                <div className="size-14 shrink-0 rounded-[8px] bg-cover bg-center" style={{ backgroundImage: `url(${creatorImage(application.handle)})` }} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black">{application.creator}</h3>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-black ${statusClass(application.status)}`}>{application.status}</span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-[#697080]">{application.handle} - {application.niche} - {application.followers} followers</p>
                  <p className="mt-1 text-xs font-bold text-[#9aa0ad]">
                    Applying to {campaigns.find((campaign) => campaign.id === application.campaignId)?.title ?? "campaign"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#eef1ff] px-3 py-1 text-xs font-black text-[#6174f8]">{application.match}% match</span>
                {application.status === "PENDING" && (
                  <>
                    <Button className="h-9 rounded-[8px] bg-[#16864f] px-3 text-sm font-black text-white hover:bg-[#127344]" type="button" onClick={() => onReview(application.id, "ACCEPTED")}>
                      Accept
                    </Button>
                    <Button className="h-9 rounded-[8px] border-[#f1d1d1] px-3 text-sm font-black text-[#b83232]" variant="outline" type="button" onClick={() => onReview(application.id, "REJECTED")}>
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}