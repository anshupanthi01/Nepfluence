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
    <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <div className="overflow-hidden rounded-[8px] border border-[#e4e7f1] bg-white shadow-sm">
        <div className="relative min-h-56 bg-[#111322] p-5 text-white">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-32"
            style={{ backgroundImage: "url(https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1400&q=80)" }}
          />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="flex items-end gap-4">
              <div className="grid size-28 place-items-center rounded-[8px] bg-white text-3xl font-black text-[#6174f8] shadow-[0_18px_50px_rgba(0,0,0,0.25)] ring-4 ring-white/18">
                HG
              </div>
              <div>
                <p className="inline-flex items-center gap-1 rounded-full bg-white/12 px-3 py-1 text-xs font-black text-[#c9d1ff]">
                  <BadgeCheck className="size-3.5" aria-hidden="true" />
                  Verified brand
                </p>
                <h2 className="mt-3 text-3xl font-black">Himal Glow</h2>
                <p className="mt-1 text-sm font-bold text-white/70">Skincare brand - Kathmandu, Nepal</p>
              </div>
            </div>
            <Button className="h-10 rounded-[8px] bg-white px-4 text-sm font-black text-[#17171f] hover:bg-white/90" type="button">
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              Edit profile
            </Button>
          </div>
        </div>

        <div className="p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            <div className="rounded-[8px] border border-[#edf0f6] p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-black">Business details</h3>
                <Building2 className="size-4 text-[#6174f8]" aria-hidden="true" />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <BrandField label="Brand name" value="Himal Glow" />
                <BrandField label="Industry" value="Beauty & skincare" />
                <BrandField label="Website" value="himalglow.com" />
                <BrandField label="Location" value="Kathmandu, Nepal" />
              </div>
              <label className="mt-3 block text-sm font-black text-[#484b57]">
                Brand story
                <textarea
                  className="mt-2 min-h-24 w-full resize-none rounded-[8px] border border-[#dfe3ee] px-3 py-3 text-sm font-bold leading-6 outline-none focus:border-[#6174f8] focus:ring-4 focus:ring-[#6174f8]/10"
                  defaultValue="Himal Glow creates gentle skincare built around local routines, clean ingredients, and creator-led product education."
                />
              </label>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button className="h-9 rounded-[8px] bg-[#6174f8] px-4 text-sm font-black text-white hover:bg-[#5268df]" type="button">Save profile</Button>
                <Button className="h-9 rounded-[8px] px-4 text-sm font-black" variant="outline" type="button">
                  <Globe className="size-4" aria-hidden="true" />
                  Preview public page
                </Button>
              </div>
            </div>

            <div className="rounded-[8px] border border-[#edf0f6] p-4">
              <h3 className="text-lg font-black">Brand trust</h3>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <MiniReviewStat label="Live" value={liveCampaigns.toString()} />
                <MiniReviewStat label="Spend" value={money(totalSpend)} />
                <MiniReviewStat label="Rating" value="4.8" />
              </div>
              <div className="mt-4 space-y-3 text-sm font-bold text-[#555866]">
                <p className="flex items-center gap-2 rounded-[8px] bg-[#f7f8fb] p-3"><ShieldCheck className="size-4 text-[#16864f]" /> Escrow-backed collaborations</p>
                <p className="flex items-center gap-2 rounded-[8px] bg-[#f7f8fb] p-3"><BadgeCheck className="size-4 text-[#6174f8]" /> Verified campaign owner</p>
                <p className="flex items-center gap-2 rounded-[8px] bg-[#f7f8fb] p-3"><Star className="size-4 fill-[#f7b733] text-[#f7b733]" /> Strong creator response quality</p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[8px] border border-[#edf0f6] p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-lg font-black">Creator brief preferences</h3>
                <p className="mt-1 text-sm font-bold text-[#727887]">This helps creators understand the brand before applying.</p>
              </div>
              <span className="rounded-full bg-[#eef1ff] px-3 py-1 text-xs font-black text-[#6174f8]">Public to creators</span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                "Natural product close-ups in first 3 seconds.",
                "Creator voiceover preferred over heavy text overlays.",
                "No exaggerated medical claims or copyrighted sounds.",
              ].map((rule) => (
                <div key={rule} className="rounded-[8px] bg-[#fbfcff] p-4 text-sm font-bold leading-6 text-[#555866]">
                  {rule}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-[8px] border border-[#e4e7f1] bg-white p-5 shadow-sm">
          <h3 className="text-xl font-black">Public preview</h3>
          <div className="mt-4 overflow-hidden rounded-[8px] border border-[#edf0f6]">
            <div className="h-32 bg-cover bg-center" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80)" }} />
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="grid size-12 place-items-center rounded-[8px] bg-[#111322] text-sm font-black text-white">HG</div>
                <div>
                  <p className="font-black">Himal Glow</p>
                  <p className="text-xs font-bold text-[#727887]">Beauty & skincare</p>
                </div>
              </div>
              <p className="mt-3 text-sm font-bold leading-6 text-[#555866]">
                Clean skincare campaigns with creator-led demos, real routines, and local Nepal audience fit.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[8px] border border-[#e4e7f1] bg-white p-5 shadow-sm">
          <h3 className="text-xl font-black">Profile completeness</h3>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#eef1ff]">
            <div className="h-full w-[86%] rounded-full bg-[#6174f8]" />
          </div>
          <p className="mt-3 text-sm font-bold text-[#727887]">86% complete. Add legal billing details and campaign media kit.</p>
        </div>
      </aside>
    </section>
  )
}

function BrandField({ label, value }: { label: string; value: string }) {
  return (
    <label className="text-sm font-black text-[#484b57]">
      {label}
      <input className="mt-2 h-10 w-full rounded-[8px] border border-[#dfe3ee] px-3 text-sm font-bold outline-none focus:border-[#6174f8] focus:ring-4 focus:ring-[#6174f8]/10" defaultValue={value} />
    </label>
  )
}