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

export function ActivityPanel({ activities }: { activities: Activity[] }) {
  return (
    <section className="rounded-[8px] border border-[#e4e7f1] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">Activity</h2>
          <p className="mt-1 text-sm font-medium text-[#727887]">Updates from local dashboard actions.</p>
        </div>
        <span className="rounded-full bg-[#eef1ff] px-3 py-1 text-xs font-black text-[#6174f8]">Live UI</span>
      </div>
      <div className="mt-5 space-y-3">
        {activities.map((activity) => (
          <div key={activity.id} className="flex gap-3">
            <span className={`mt-1 size-2.5 shrink-0 rounded-full ${activity.tone === "green" ? "bg-[#1f9f68]" : activity.tone === "amber" ? "bg-[#e5a122]" : activity.tone === "red" ? "bg-[#d94b4b]" : "bg-[#6174f8]"}`} />
            <p className="text-sm font-bold leading-6 text-[#555866]">{activity.message}</p>
          </div>
        ))}
      </div>
    </section>
  )
}