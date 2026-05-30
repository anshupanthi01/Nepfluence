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
} from "./brand-dashboard.shared"

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

export function CollaborationsPanel({
  collaborations,
  onDeposit,
  onApprove,
}: {
  collaborations: Collaboration[]
  onDeposit: (id: number) => void
  onApprove: (id: number) => void
}) {
  return (
    <section className="rounded-[8px] border border-[#e4e7f1] bg-white shadow-sm">
      <div className="border-b border-[#edf0f6] p-5">
        <h2 className="text-xl font-black">Collaborations</h2>
        <p className="mt-1 text-sm font-medium text-[#727887]">Escrow controls chat access and deliverable approval.</p>
      </div>
      <div className="grid gap-4 p-5 lg:grid-cols-2">
        {collaborations.map((collab) => (
          <article key={collab.id} className="rounded-[8px] border border-[#edf0f6] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-black">{collab.campaign}</h3>
                <p className="mt-1 text-sm font-bold text-[#697080]">{collab.creator}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-black ${statusClass(collab.state)}`}>{collab.state}</span>
            </div>
            <p className="mt-4 rounded-[8px] bg-[#f7f8fb] p-3 text-sm font-bold text-[#606675]">{collab.deliverable}</p>
            {collab.submission ? (
              <div className="mt-4 overflow-hidden rounded-[8px] border border-[#dfe4ff] bg-[#fbfcff]">
                <div className="grid min-h-40 place-items-center bg-[#111322] p-5 text-center text-white">
                  <div>
                    <PlayCircle className="mx-auto size-10 text-[#9fb0ff]" aria-hidden="true" />
                    <p className="mt-3 text-sm font-black">Creator video ready for review</p>
                    <a className="mt-2 inline-flex text-xs font-black text-[#b9c3ff] hover:underline" href={collab.submission.videoUrl} target="_blank" rel="noreferrer">
                      Open video draft
                    </a>
                  </div>
                </div>
                <div className="space-y-3 p-4">
                  <div className="grid grid-cols-2 gap-2">
                    <MiniReviewStat label="Format" value={collab.submission.aspectRatio} />
                    <MiniReviewStat label="Duration" value={collab.submission.duration} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase text-[#9aa0ad]">Caption</p>
                    <p className="mt-1 text-sm font-bold leading-6 text-[#555866]">{collab.submission.caption || "No caption added."}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase text-[#9aa0ad]">Creator notes</p>
                    <p className="mt-1 text-sm font-bold leading-6 text-[#555866]">{collab.submission.notes || "No notes added."}</p>
                  </div>
                  <div className="grid gap-2">
                    {[
                      ["Brief matched", collab.submission.checklist.briefMatched],
                      ["Usage rights confirmed", collab.submission.checklist.usageRights],
                      ["No copyrighted music", collab.submission.checklist.noCopyrightMusic],
                    ].map(([label, checked]) => (
                      <div key={label as string} className="flex items-center justify-between rounded-[8px] bg-[#f7f8fb] p-2 text-xs font-black text-[#606675]">
                        <span>{label}</span>
                        <span className={checked ? "text-[#16864f]" : "text-[#b83232]"}>{checked ? "Done" : "Missing"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-[8px] border border-dashed border-[#dfe3ee] bg-[#fbfcff] p-4 text-sm font-bold text-[#727887]">
                Waiting for creator to submit the required video and review form.
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {collab.escrow === "PENDING" && (
                <button className="h-9 rounded-[8px] bg-[#6174f8] px-3 text-sm font-black text-white" type="button" onClick={() => onDeposit(collab.id)}>
                  Deposit escrow
                </button>
              )}
              {collab.state === "IN_PROGRESS" && (
                <span className="inline-flex h-9 items-center rounded-[8px] border border-[#e1e4ef] px-3 text-sm font-black text-[#555866]">
                  Awaiting video
                </span>
              )}
              {collab.state === "SUBMITTED" && (
                <button className="h-9 rounded-[8px] bg-[#16864f] px-3 text-sm font-black text-white" type="button" onClick={() => onApprove(collab.id)} disabled={!collab.submission}>
                  Approve deliverable
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function MiniReviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] bg-[#f7f8fb] p-3">
      <div className="text-xs font-bold text-[#8a909f]">{label}</div>
      <div className="mt-1 text-sm font-black text-[#484b57]">{value}</div>
    </div>
  )
}

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

export function MessagesPanel({
  collaborations,
  messages,
  selectedRoomId,
  message,
  onMessageChange,
  onRoomChange,
  onSend,
}: {
  collaborations: Collaboration[]
  messages: ReturnType<typeof useMarketplaceStore>["messages"]
  selectedRoomId: number
  message: string
  onMessageChange: (message: string) => void
  onRoomChange: (roomId: number) => void
  onSend: () => void
}) {
  const activeRoom = collaborations.find((collab) => collab.id === selectedRoomId) ?? collaborations[0]
  const roomMessages = messages.filter((item) => item.roomId === activeRoom?.id)

  return (
    <section className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <div className="rounded-[8px] border border-[#e4e7f1] bg-white p-4 shadow-sm">
        {collaborations.map((collab) => (
          <button key={collab.id} className={`mb-2 flex w-full items-center gap-3 rounded-[8px] p-3 text-left ${activeRoom?.id === collab.id ? "bg-[#eef1ff]" : "hover:bg-[#f7f8fb]"}`} type="button" onClick={() => onRoomChange(collab.id)}>
            <span className="grid size-10 place-items-center rounded-full bg-[#6174f8] text-sm font-black text-white">{collab.creator.charAt(0)}</span>
            <span>
              <span className="block text-sm font-black">{collab.creator}</span>
              <span className="block text-xs font-bold text-[#8a909f]">{collab.campaign}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="rounded-[8px] border border-[#e4e7f1] bg-white shadow-sm">
        <div className="border-b border-[#edf0f6] p-5">
          <h2 className="text-xl font-black">{activeRoom?.creator ?? "Messages"}</h2>
          <p className="mt-1 text-sm font-medium text-[#727887]">{activeRoom?.escrow === "HELD" ? "Chat is unlocked because escrow is held." : "Chat unlocks when escrow is deposited."}</p>
        </div>
        <div className="min-h-[320px] space-y-3 p-5">
          {roomMessages.map((item) => (
            <div key={item.id} className={item.sender === "brand" ? "ml-auto max-w-md" : "max-w-md"}>
              <p className="mb-1 text-xs font-black text-[#8a909f]">{item.senderName}</p>
              <p className={`rounded-[8px] p-3 text-sm font-bold ${item.sender === "brand" ? "bg-[#6174f8] text-white" : "bg-[#f3f5fb] text-[#555866]"}`}>
                {item.body}
              </p>
            </div>
          ))}
          {roomMessages.length === 0 && (
            <p className="rounded-[8px] border border-dashed border-[#dfe3ee] p-4 text-sm font-bold text-[#727887]">No messages yet. Send the first collaboration update.</p>
          )}
        </div>
        <div className="flex gap-2 border-t border-[#edf0f6] p-4">
          <input
            className="h-10 flex-1 rounded-[8px] border border-[#e1e4ef] px-3 text-sm font-bold outline-none focus:border-[#6174f8]"
            placeholder="Type a message..."
            value={message}
            onChange={(event) => onMessageChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onSend()
            }}
          />
          <button className="grid size-10 place-items-center rounded-[8px] bg-[#6174f8] text-white" type="button" aria-label="Send message" onClick={onSend}>
            <Send className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  )
}

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

export function NotificationPanel({ activities, onClose }: { activities: Activity[]; onClose: () => void }) {
  return (
    <section className="fixed right-5 top-20 z-50 w-[min(380px,calc(100vw-2rem))] rounded-[8px] border border-[#e4e7f1] bg-white shadow-[0_18px_50px_rgba(25,28,50,0.2)]">
      <div className="flex items-start justify-between gap-3 border-b border-[#edf0f6] p-4">
        <div>
          <p className="text-xs font-black uppercase text-[#6174f8]">Notifications</p>
          <h2 className="text-lg font-black">Workspace updates</h2>
        </div>
        <button className="grid size-8 place-items-center rounded-full bg-[#f3f5fb]" type="button" aria-label="Close notifications" onClick={onClose}>
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="space-y-3 p-4">
        {activities.map((activity) => (
          <p key={activity.id} className="rounded-[8px] bg-[#f7f8fb] p-3 text-sm font-bold leading-6 text-[#606675]">
            {activity.message}
          </p>
        ))}
      </div>
    </section>
  )
}

export function MetricCard({ icon: Icon, label, value, detail }: { icon: typeof LayoutDashboard; label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[8px] border border-[#e4e7f1] bg-white p-5 shadow-sm">
      <span className="grid size-10 place-items-center rounded-[8px] bg-[#eef1ff] text-[#6174f8]">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="mt-4 text-3xl font-black">{value}</div>
      <div className="mt-1 text-sm font-black text-[#484b57]">{label}</div>
      <div className="mt-1 text-xs font-bold text-[#8a909f]">{detail}</div>
    </div>
  )
}
