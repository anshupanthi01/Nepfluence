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
  MarketplaceLedgerEntry,
  MarketplaceWallet,
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

import { CollaborationsPanel } from "./CollaborationsPanel"
import { MetricCard } from "./MetricCard"
export function PayoutsPanel({
  collaborations,
  wallet,
  ledger,
  onSubmit,
}: {
  collaborations: Collaboration[]
  wallet: MarketplaceWallet | null
  ledger: MarketplaceLedgerEntry[]
  onSubmit: (id: number) => void
}) {
  const escrowHeld = collaborations.filter((item) => item.escrow === "HELD").reduce((sum, item) => sum + item.payout, 0)
  const released = collaborations.filter((item) => item.escrow === "RELEASED").reduce((sum, item) => sum + item.payout, 0)

  return (
    <section className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard icon={WalletCards} label="Creator wallet" value={money(wallet?.balance ?? 0)} detail="Available simulated balance" />
        <MetricCard icon={IndianRupee} label="Escrow held" value={money(escrowHeld)} detail="Protected by brand deposit" />
        <MetricCard icon={Clock3} label="Pending brand escrow" value={collaborations.filter((item) => item.escrow === "PENDING").length.toString()} detail="Chat locked until deposit" />
      </div>
      <section className="rounded-[24px] border border-[#e8e2d9] bg-[#fbfaf7] p-5 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8a8175]">Payout ledger</p>
            <h2 className="mt-1 text-lg font-black text-[#1f252b]">Creator payment movement</h2>
          </div>
          <p className="text-xs font-semibold text-[#69716b]">{money(released)} released into your wallet after approvals.</p>
        </div>
        <div className="mt-4 divide-y divide-[#e8e2d9] overflow-hidden rounded-[18px] border border-[#e8e2d9] bg-white">
          {ledger.map((entry) => (
            <div key={entry.id} className="grid gap-2 p-4 text-sm sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="font-black text-[#1f252b]">{entry.type === "PAYOUT_RELEASE" ? "Payout received" : "Escrow protected"}</p>
                <p className="mt-1 text-xs font-semibold text-[#69716b]">{new Date(entry.createdAt).toLocaleString()}</p>
              </div>
              <p className="font-black text-[#1f252b]">{money(entry.amount)}</p>
            </div>
          ))}
          {ledger.length === 0 && (
            <div className="p-5 text-center">
              <p className="text-sm font-black text-[#1f252b]">No payout movement yet</p>
              <p className="mt-1 text-xs font-semibold text-[#69716b]">Escrow and releases will appear here as brands fund and approve work.</p>
            </div>
          )}
        </div>
      </section>
      <CollaborationsPanel collaborations={collaborations} onSubmit={onSubmit} />
    </section>
  )
}
