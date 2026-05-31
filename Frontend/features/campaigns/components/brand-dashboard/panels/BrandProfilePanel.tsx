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

import { MiniReviewStat } from "./ReviewStats"
export function BrandProfilePanel({ campaigns, collaborations }: { campaigns: Campaign[]; collaborations: Collaboration[] }) {
  const liveCampaigns = campaigns.filter((campaign) => campaign.status === "OPEN").length
  const totalSpend = collaborations.reduce((sum, collab) => sum + collab.payout, 0)

  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_320px]">
      <div className="overflow-hidden rounded-[24px] border border-[#e8e2d9] bg-[#fbfaf7] shadow-sm">
        <div className="grid gap-5 border-b border-[#e8e2d9] p-5 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col justify-between gap-8">
            <div className="flex items-start gap-4">
              <div className="grid size-20 place-items-center rounded-[18px] border border-[#e8e2d9] bg-white text-2xl font-black tracking-tight text-[#1f252b] shadow-sm">
                HG
              </div>
              <div className="min-w-0">
                <p className="inline-flex items-center gap-1 rounded-full bg-[#f0ece5] px-2.5 py-1 text-[11px] font-black text-[#4d5751]">
                  <BadgeCheck className="size-3.5" aria-hidden="true" />
                  Verified brand
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-[#1f252b]">Himal Glow</h2>
                <p className="mt-1 text-sm font-semibold text-[#69716b]">Skincare brand - Kathmandu, Nepal</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button className="h-9 rounded-full bg-[#1f252b] px-4 text-xs font-black text-white hover:bg-[#303840]" type="button">
                <SlidersHorizontal className="size-3.5" aria-hidden="true" />
                Edit profile
              </Button>
              <Button className="h-9 rounded-full border-[#ded8cf] px-4 text-xs font-black text-[#1f252b]" variant="outline" type="button">
                <Globe className="size-3.5" aria-hidden="true" />
                Preview public page
              </Button>
            </div>
          </div>

          <div className="min-h-52 overflow-hidden rounded-[22px] border border-[#e8e2d9] bg-cover bg-center" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1100&q=80)" }}>
            <div className="flex h-full items-end bg-gradient-to-t from-[#1f252b]/45 to-transparent p-4">
              <p className="max-w-xs text-sm font-semibold leading-6 text-white">Clean creator-led skincare education, local routines, and gentle product demos.</p>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_0.82fr]">
            <div className="rounded-[22px] border border-[#e8e2d9] bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-black tracking-tight">Business details</h3>
                <Building2 className="size-4 text-[#8a8175]" aria-hidden="true" />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <BrandField label="Brand name" value="Himal Glow" />
                <BrandField label="Industry" value="Beauty & skincare" />
                <BrandField label="Website" value="himalglow.com" />
                <BrandField label="Location" value="Kathmandu, Nepal" />
              </div>
              <label className="mt-3 block text-xs font-black text-[#505852]">
                Brand story
                <textarea
                  className="mt-2 min-h-24 w-full resize-none rounded-[16px] border border-[#ded8cf] bg-[#fbfaf7] px-3 py-3 text-sm font-semibold leading-6 outline-none focus:border-[#1f252b] focus:ring-4 focus:ring-[#1f252b]/5"
                  defaultValue="Himal Glow creates gentle skincare built around local routines, clean ingredients, and creator-led product education."
                />
              </label>
              <div className="mt-4">
                <Button className="h-9 rounded-full bg-[#1f252b] px-4 text-xs font-black text-white hover:bg-[#303840]" type="button">Save profile</Button>
              </div>
            </div>

            <div className="rounded-[22px] border border-[#e8e2d9] bg-white p-4">
              <h3 className="text-base font-black tracking-tight">Brand trust</h3>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <MiniReviewStat label="Live" value={liveCampaigns.toString()} />
                <MiniReviewStat label="Spend" value={money(totalSpend)} />
                <MiniReviewStat label="Rating" value="4.8" />
              </div>
              <div className="mt-4 space-y-2 text-xs font-bold text-[#505852]">
                <p className="flex items-center gap-2 rounded-[16px] bg-[#fbfaf7] p-3"><ShieldCheck className="size-4 text-[#16864f]" /> Escrow-backed collaborations</p>
                <p className="flex items-center gap-2 rounded-[16px] bg-[#fbfaf7] p-3"><BadgeCheck className="size-4 text-[#1f252b]" /> Verified campaign owner</p>
                <p className="flex items-center gap-2 rounded-[16px] bg-[#fbfaf7] p-3"><Star className="size-4 fill-[#b78c35] text-[#b78c35]" /> Strong creator response quality</p>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-[22px] border border-[#e8e2d9] bg-white p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-base font-black tracking-tight">Creator brief preferences</h3>
                <p className="mt-1 text-xs font-semibold text-[#69716b]">This helps creators understand the brand before applying.</p>
              </div>
              <span className="rounded-full bg-[#f0ece5] px-3 py-1 text-[11px] font-black text-[#505852]">Public to creators</span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                "Natural product close-ups in first 3 seconds.",
                "Creator voiceover preferred over heavy text overlays.",
                "No exaggerated medical claims or copyrighted sounds.",
              ].map((rule) => (
                <div key={rule} className="rounded-[18px] bg-[#fbfaf7] p-4 text-xs font-semibold leading-5 text-[#505852]">
                  {rule}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-[22px] border border-[#e8e2d9] bg-[#fbfaf7] p-4 shadow-sm">
          <h3 className="text-base font-black tracking-tight">Public preview</h3>
          <div className="mt-3 overflow-hidden rounded-[20px] border border-[#e8e2d9] bg-white">
            <div className="h-28 bg-cover bg-center" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80)" }} />
            <div className="p-3">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-[14px] bg-[#1f252b] text-xs font-black text-white">HG</div>
                <div>
                  <p className="text-sm font-black">Himal Glow</p>
                  <p className="text-xs font-semibold text-[#69716b]">Beauty & skincare</p>
                </div>
              </div>
              <p className="mt-3 text-xs font-semibold leading-5 text-[#505852]">
                Clean skincare campaigns with creator-led demos, real routines, and local Nepal audience fit.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[22px] border border-[#e8e2d9] bg-[#fbfaf7] p-4 shadow-sm">
          <h3 className="text-base font-black tracking-tight">Profile completeness</h3>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#e8e2d9]">
            <div className="h-full w-[86%] rounded-full bg-[#1f252b]" />
          </div>
          <p className="mt-3 text-xs font-semibold leading-5 text-[#69716b]">86% complete. Add legal billing details and campaign media kit.</p>
        </div>
      </aside>
    </section>
  )
}

function BrandField({ label, value }: { label: string; value: string }) {
  return (
    <label className="text-xs font-black text-[#505852]">
      {label}
      <input className="mt-2 h-9 w-full rounded-[14px] border border-[#ded8cf] bg-[#fbfaf7] px-3 text-sm font-semibold outline-none focus:border-[#1f252b] focus:ring-4 focus:ring-[#1f252b]/5" defaultValue={value} />
    </label>
  )
}
