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

export function DiscoverPanel({
  creators,
  filter,
  search,
  selectedCreator,
  onFilter,
  onSearch,
  onSelect,
  onShortlist,
}: {
  creators: Creator[]
  filter: "ALL" | "NP" | "IN"
  search: string
  selectedCreator: Creator
  onFilter: (filter: "ALL" | "NP" | "IN") => void
  onSearch: (search: string) => void
  onSelect: (creator: Creator) => void
  onShortlist: (name: string) => void
}) {
  const selectedWork = creatorWorkSamples.filter((sample) => sample.creator === selectedCreator.handle)
  const analytics = creatorAnalytics[selectedCreator.handle as keyof typeof creatorAnalytics]

  return (
    <section className="space-y-4">
      <div className="rounded-[8px] border border-[#e4e7f1] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-black">Discover Creators</h2>
            <p className="mt-1 text-sm font-medium text-[#727887]">Manual discovery first, matching engine later when the marketplace has data.</p>
          </div>
          <label className="flex items-center gap-2 rounded-[8px] border border-[#e1e4ef] px-3 py-2 text-sm font-bold text-[#727887]">
            <Search className="size-4" aria-hidden="true" />
            <input
              className="w-full bg-transparent text-sm font-bold outline-none placeholder:text-[#727887]"
              value={search}
              onChange={(event) => onSearch(event.target.value)}
              placeholder="Search by niche, country, handle"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {(["ALL", "NP", "IN"] as const).map((country) => (
            <button
              key={country}
              className={`rounded-full px-4 py-2 text-sm font-black ${filter === country ? "bg-[#6174f8] text-white" : "bg-[#f3f5fb] text-[#606675]"}`}
              type="button"
              onClick={() => onFilter(country)}
            >
              {country === "ALL" ? "All countries" : country}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
          {creators.map((creator) => (
            <button
              key={creator.handle}
              className={`overflow-hidden rounded-[8px] border bg-white text-left shadow-sm transition ${
                selectedCreator.handle === creator.handle ? "border-[#6174f8] ring-2 ring-[#dfe3ff]" : "border-[#e4e7f1] hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(43,48,79,0.1)]"
              }`}
              type="button"
              onClick={() => onSelect(creator)}
            >
              <div className="relative aspect-[4/3] bg-cover bg-center" style={{ backgroundImage: `url(${creator.image})` }}>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/62 to-transparent p-3">
                  <p className="text-xs font-black text-white">{creator.niche}</p>
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate text-sm font-black">{creator.name}</h3>
                  <span className="rounded-full bg-[#f3f5fb] px-2 py-0.5 text-[11px] font-black">{creator.country}</span>
                </div>
                <p className="mt-1 truncate text-xs font-bold text-[#727887]">{creator.handle}</p>
                <div className="mt-3 flex items-center justify-between text-[11px] font-black text-[#606675]">
                  <span>{creator.followers}</span>
                  <span className="inline-flex items-center gap-1">
                    <Star className="size-3 fill-[#f7b733] text-[#f7b733]" aria-hidden="true" />
                    {creator.rating}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        <aside className="rounded-[8px] border border-[#e4e7f1] bg-white p-5 shadow-sm">
          <div className="h-36 rounded-[8px] bg-cover bg-center" style={{ backgroundImage: `url(${selectedCreator.image})` }} />
          <h3 className="mt-4 text-lg font-black">{selectedCreator.name}</h3>
          <p className="mt-1 text-sm font-bold text-[#727887]">{selectedCreator.handle} - {selectedCreator.country}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-[8px] bg-[#f7f8fb] p-2.5">
              <div className="font-black">{selectedCreator.followers}</div>
              <div className="text-xs font-bold text-[#8a909f]">Followers</div>
            </div>
            <div className="rounded-[8px] bg-[#f7f8fb] p-2.5">
              <div className="flex items-center gap-1 font-black"><Star className="size-4 fill-[#f7b733] text-[#f7b733]" /> {selectedCreator.rating}</div>
              <div className="text-xs font-bold text-[#8a909f]">Rating</div>
            </div>
          </div>
          <button className="mt-4 h-9 w-full rounded-[8px] bg-[#6174f8] text-sm font-black text-white" type="button" onClick={() => onShortlist(selectedCreator.name)}>
            Shortlist creator
          </button>
        </aside>
      </div>

      <section className="rounded-[8px] border border-[#e4e7f1] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-black">Creator work</h2>
            <p className="mt-1 text-sm font-medium text-[#727887]">Past videos posted on Nepfluence for brand review.</p>
          </div>
          <span className="rounded-full bg-[#eef1ff] px-3 py-1 text-xs font-black text-[#6174f8]">{selectedWork.length || 0} samples</span>
        </div>

        {selectedWork.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {selectedWork.map((sample) => (
              <article key={sample.title} className="overflow-hidden rounded-[8px] border border-[#edf0f6]">
                <div className="relative h-40 bg-cover bg-center" style={{ backgroundImage: `url(${sample.image})` }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/58 via-transparent to-transparent" />
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-1 text-[11px] font-black text-[#26233d]">Video</span>
                  <span className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-black/45 text-white backdrop-blur">
                    <PlayCircle className="size-4" aria-hidden="true" />
                  </span>
                  <p className="absolute bottom-3 left-3 right-3 text-xs font-black text-white">{sample.platform}</p>
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-black">{sample.title}</h3>
                  <p className="mt-1 text-xs font-bold text-[#727887]">{sample.metric}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-[8px] border border-dashed border-[#dfe3ee] bg-[#fbfcff] p-5 text-sm font-bold text-[#727887]">
            This creator has not posted portfolio videos yet.
          </div>
        )}
      </section>

      <section className="rounded-[8px] border border-[#e4e7f1] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-black">Creator analytics</h2>
            <p className="mt-1 text-sm font-medium text-[#727887]">Performance details brands can use before shortlisting or accepting applications.</p>
          </div>
          <span className="rounded-full bg-[#e9f8ef] px-3 py-1 text-xs font-black text-[#16864f]">Verified metrics</span>
        </div>

        {analytics ? (
          <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <AnalyticsCard label="Engagement rate" value={analytics.engagementRate} detail="Likes, comments, saves" />
              <AnalyticsCard label="Average views" value={analytics.avgViews} detail="Last 30 days" />
              <AnalyticsCard label="Average likes" value={analytics.avgLikes} detail="Per short-form post" />
              <AnalyticsCard label="Monthly reach" value={analytics.monthlyReach} detail="Estimated unique accounts" />
              <AnalyticsCard label="Saves" value={analytics.saves} detail="High intent actions" />
              <AnalyticsCard label="Completion rate" value={analytics.completionRate} detail="Video watch-through" />
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
              <AnalyticsBreakdown title="Audience location" items={analytics.audience} />
              <AnalyticsBreakdown title="Audience age" items={analytics.age} />
              <div className="rounded-[8px] border border-[#edf0f6] bg-[#111322] p-4 text-white">
                <p className="text-xs font-black uppercase text-[#b9c3ff]">Brand fit signal</p>
                <p className="mt-3 text-2xl font-black">Strong beauty match</p>
                <p className="mt-2 text-sm font-bold leading-6 text-white/68">
                  Best for skincare launches, product demos, local UGC, and short-form conversion hooks.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-[8px] border border-dashed border-[#dfe3ee] bg-[#fbfcff] p-5 text-sm font-bold text-[#727887]">
            Analytics will appear after this creator connects social accounts or posts work on Nepfluence.
          </div>
        )}
      </section>
    </section>
  )
}

function AnalyticsCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[8px] border border-[#edf0f6] bg-[#fbfcff] p-4">
      <p className="text-xs font-black uppercase text-[#8a909f]">{label}</p>
      <p className="mt-2 text-3xl font-black text-[#17171f]">{value}</p>
      <p className="mt-1 text-xs font-bold text-[#727887]">{detail}</p>
    </div>
  )
}

function AnalyticsBreakdown({ title, items }: { title: string; items: { label: string; value: string }[] }) {
  return (
    <div className="rounded-[8px] border border-[#edf0f6] p-4">
      <h3 className="text-sm font-black">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between text-xs font-black text-[#606675]">
              <span>{item.label}</span>
              <span>{item.value}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#eef1ff]">
              <div className="h-full rounded-full bg-[#6174f8]" style={{ width: item.value }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}