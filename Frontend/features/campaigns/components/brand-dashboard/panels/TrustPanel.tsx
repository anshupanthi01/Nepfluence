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

import { MetricCard } from "./MetricCard"
export function TrustPanel() {
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <MetricCard icon={BadgeCheck} label="Verified creators" value="4/5" detail="Manual profile review" />
      <MetricCard icon={AlertTriangle} label="Open disputes" value="0" detail="Admin queue clear" />
      <MetricCard icon={ShieldCheck} label="Escrow protected" value="100%" detail="Brand to creator only" />
      <div className="rounded-[8px] border border-[#e4e7f1] bg-white p-5 shadow-sm lg:col-span-3">
        <h2 className="text-xl font-black">Trust rules from the architecture</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {["Campaign brief locks after creator acceptance.", "Influencer never deposits money to brand.", "Disputes hold escrow until admin resolution."].map((rule) => (
            <div key={rule} className="rounded-[8px] bg-[#f7f8fb] p-4 text-sm font-bold text-[#555866]">{rule}</div>
          ))}
        </div>
      </div>
    </section>
  )
}