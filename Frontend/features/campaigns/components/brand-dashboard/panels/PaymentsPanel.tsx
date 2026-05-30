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

import { CollaborationsPanel } from "./CollaborationsPanel"
import { MetricCard } from "./MetricCard"
export function PaymentsPanel({
  collaborations,
  paymentTotal,
  onDeposit,
  onApprove,
}: {
  collaborations: Collaboration[]
  paymentTotal: number
  onDeposit: (id: number) => void
  onApprove: (id: number) => void
}) {
  return (
    <section className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard icon={WalletCards} label="Escrow held" value={money(paymentTotal)} detail="Mock provider for MVP" />
        <MetricCard icon={IndianRupee} label="Pending deposit" value={collaborations.filter((item) => item.escrow === "PENDING").length.toString()} detail="Required before chat" />
        <MetricCard icon={CheckCircle2} label="Released payouts" value={collaborations.filter((item) => item.escrow === "RELEASED").length.toString()} detail="Queued for payout" />
      </div>
      <CollaborationsPanel collaborations={collaborations} onDeposit={onDeposit} onApprove={onApprove} />
    </section>
  )
}