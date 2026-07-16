"use client"

import { ArrowRight, Bookmark, CalendarDays, Heart, MessageSquare, Search, Send, X } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { KeyboardEvent, MouseEvent, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { readMockSession } from "@/lib/auth"
import { useEscapeKey } from "@/hooks/useEscapeKey"
import { type CreatorCampaign, campaignImage, money, statusClass } from "../creator-dashboard.shared"

function readSavedIds(key: string) {
  if (typeof window === "undefined") return []
  const raw = window.localStorage.getItem(key)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as number[]) : []
  } catch {
    return []
  }
}

function writeSavedIds(key: string, ids: number[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(key, JSON.stringify(ids))
}

export function CampaignsPanel({
  campaigns,
  search,
  onSearch,
  onApply,
  onMessageBrand,
  onWithdraw,
  compact = false,
}: {
  campaigns: CreatorCampaign[]
  search: string
  onSearch: (search: string) => void
  onApply: (id: number) => void
  onMessageBrand: (campaignId: number, message: string) => void
  onWithdraw: (id: number) => void
  compact?: boolean
}) {
  const visibleCampaigns = compact ? campaigns.slice(0, 2) : campaigns
  const userId = readMockSession()?.userId
  const likesKey = `nepfluence-creator-likes:${userId ?? "guest"}`
  const bookmarksKey = `nepfluence-creator-bookmarks:${userId ?? "guest"}`
  const [likedCampaignIds, setLikedCampaignIds] = useState<number[]>([])
  const [bookmarkedCampaignIds, setBookmarkedCampaignIds] = useState<number[]>([])
  const [detailCampaignId, setDetailCampaignId] = useState<number | null>(null)
  const [messageCampaignId, setMessageCampaignId] = useState<number | null>(null)
  const [notice, setNotice] = useState("")
  const detailCampaign = useMemo(() => campaigns.find((campaign) => campaign.id === detailCampaignId) ?? null, [campaigns, detailCampaignId])
  const messageCampaign = useMemo(() => campaigns.find((campaign) => campaign.id === messageCampaignId) ?? null, [campaigns, messageCampaignId])

  useEffect(() => {
    setLikedCampaignIds(readSavedIds(likesKey))
    setBookmarkedCampaignIds(readSavedIds(bookmarksKey))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  function toggleId(ids: number[], id: number) {
    return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]
  }

  function stopCardClick(event: MouseEvent<HTMLElement>) {
    event.stopPropagation()
  }

  function toggleLikeFor(campaign: CreatorCampaign) {
    const wasLiked = likedCampaignIds.includes(campaign.id)
    const next = toggleId(likedCampaignIds, campaign.id)
    setLikedCampaignIds(next)
    writeSavedIds(likesKey, next)
    setNotice(`${campaign.title} ${wasLiked ? "removed from liked campaigns" : "added to liked campaigns"}.`)
  }

  function toggleBookmarkFor(campaign: CreatorCampaign) {
    const wasBookmarked = bookmarkedCampaignIds.includes(campaign.id)
    const next = toggleId(bookmarkedCampaignIds, campaign.id)
    setBookmarkedCampaignIds(next)
    writeSavedIds(bookmarksKey, next)
    setNotice(`${campaign.title} ${wasBookmarked ? "removed from saved campaigns" : "saved to bookmarks"}.`)
  }

  function toggleLike(event: MouseEvent<HTMLButtonElement>, campaign: CreatorCampaign) {
    stopCardClick(event)
    toggleLikeFor(campaign)
  }

  function toggleBookmark(event: MouseEvent<HTMLButtonElement>, campaign: CreatorCampaign) {
    stopCardClick(event)
    toggleBookmarkFor(campaign)
  }

  function openMessage(event: MouseEvent<HTMLButtonElement>, campaign: CreatorCampaign) {
    stopCardClick(event)
    setMessageCampaignId(campaign.id)
  }

  function openDetails(campaign: CreatorCampaign) {
    setDetailCampaignId(campaign.id)
  }

  function handleCardKeyDown(event: KeyboardEvent<HTMLElement>, campaign: CreatorCampaign) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      openDetails(campaign)
    }
  }

  function goToMessages(campaign: CreatorCampaign) {
    onMessageBrand(campaign.id, "")
    setMessageCampaignId(null)
  }

  return (
    <section className="overflow-hidden rounded-[24px] border border-[#e8e2d9] bg-[#fbfaf7] shadow-[0_12px_34px_rgba(31,37,43,0.06)]">
      <div className="flex flex-col gap-3 border-b border-[#e8e2d9] px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8a8175]">Campaigns</p>
          <h2 className="mt-1 text-xl font-black tracking-tight text-[#1f252b]">{compact ? "Recommended campaigns" : "Find campaigns"}</h2>
          <p className="mt-1 max-w-xl text-sm font-semibold leading-5 text-[#69716b]">Clean briefs that match your content, audience, and availability.</p>
        </div>
        <label className="flex h-10 min-w-0 items-center gap-2 rounded-full border border-[#ded8cf] bg-white px-3 text-sm font-semibold text-[#69716b] shadow-sm md:w-72">
          <Search className="size-4 shrink-0 text-[#8a8175]" aria-hidden="true" />
          <input
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#98a2b3]"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search campaign or brand"
          />
        </label>
      </div>
      {notice && (
        <div className="border-b border-[#e8e2d9] bg-[#f5f1ea] px-5 py-2 text-xs font-black text-[#505852]">
          {notice}
        </div>
      )}

      <div className={`grid gap-3 p-4 ${compact ? "lg:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-3"}`}>
        {visibleCampaigns.map((campaign) => {
          const liked = likedCampaignIds.includes(campaign.id)
          const bookmarked = bookmarkedCampaignIds.includes(campaign.id)

          return (
          <article
            key={campaign.id}
            className="group cursor-pointer overflow-hidden rounded-[22px] border border-[#e8e2d9] bg-white transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(31,37,43,0.10)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f252b]"
            role="button"
            tabIndex={0}
            onClick={() => openDetails(campaign)}
            onKeyDown={(event) => handleCardKeyDown(event, campaign)}
          >
            <div className="relative h-40 bg-[#eee8df] bg-cover bg-center" style={{ backgroundImage: `url(${campaignImage(campaign)})` }}>
              <div className="absolute inset-0 bg-gradient-to-t from-[#1f252b]/60 via-transparent to-transparent" />
              <div className="absolute left-3 top-3 flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${statusClass(campaign.status)}`}>{campaign.status.replace("_", " ")}</span>
                <span className="rounded-full bg-white/92 px-2.5 py-1 text-[11px] font-black text-[#1f252b]">{campaign.match}% fit</span>
              </div>
              <div className="absolute bottom-3 left-3 right-3">
                <h3 className="line-clamp-2 text-lg font-black leading-5 tracking-tight text-white">{campaign.title}</h3>
                <p className="mt-1 text-xs font-bold text-white/82">{campaign.brand} / {campaign.platform}</p>
              </div>
            </div>

            <div className="p-4">
              <p className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-[#505852]">{campaign.brief}</p>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <MiniCampaignStat label="Budget" value={money(campaign.budget)} />
                <MiniCampaignStat label="Reach" value={campaign.reach > 0 ? `${Math.round(campaign.reach / 1000)}K` : "0"} />
                <MiniCampaignStat label="Country" value={campaign.country} />
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-[#f0ece5] px-2.5 py-1 text-[11px] font-black text-[#69716b]">{campaign.niche}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#f0ece5] px-2.5 py-1 text-[11px] font-black text-[#69716b]">
                  <CalendarDays className="size-3" aria-hidden="true" />
                  {campaign.deadline}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <div className="flex gap-1.5">
                  <IconButton active={liked} label={liked ? "Unlike campaign" : "Like campaign"} icon={Heart} onClick={(event) => toggleLike(event, campaign)} />
                  <IconButton active={bookmarked} label={bookmarked ? "Remove bookmark" : "Bookmark campaign"} icon={Bookmark} onClick={(event) => toggleBookmark(event, campaign)} />
                  <IconButton label="Message brand" icon={MessageSquare} onClick={(event) => openMessage(event, campaign)} />
                </div>
                <div className="flex gap-2">
                  {campaign.status === "NOT_APPLIED" && (
                    <Button className="h-9 rounded-full bg-[#1f252b] px-4 text-xs font-black text-white hover:bg-[#363d43]" type="button" onClick={(event) => { stopCardClick(event); onApply(campaign.id) }}>
                      Apply <ArrowRight className="size-3.5" aria-hidden="true" />
                    </Button>
                  )}
                  {campaign.status === "PENDING" && (
                    <Button className="h-9 rounded-full border-[#ded8cf] px-4 text-xs font-black text-[#9b6500]" variant="outline" type="button" onClick={(event) => { stopCardClick(event); onWithdraw(campaign.id) }}>
                      Withdraw
                    </Button>
                  )}
                  {campaign.status === "ACCEPTED" && (
                    <span className="inline-flex h-9 items-center justify-center rounded-full bg-[#e9f8ef] px-4 text-xs font-black text-[#16864f]">Accepted</span>
                  )}
                </div>
              </div>
            </div>
          </article>
        )})}
        {visibleCampaigns.length === 0 && (
          <div className="rounded-[22px] border border-dashed border-[#ded8cf] bg-white p-8 text-center md:col-span-2 xl:col-span-3">
            <p className="text-sm font-black text-[#1f252b]">No campaigns available yet</p>
            <p className="mt-2 text-xs font-semibold text-[#69716b]">Brand campaigns will appear here after real brands publish them.</p>
          </div>
        )}
      </div>

      {detailCampaign && (
        <CampaignDetailModal
          campaign={detailCampaign}
          bookmarked={bookmarkedCampaignIds.includes(detailCampaign.id)}
          liked={likedCampaignIds.includes(detailCampaign.id)}
          onApply={onApply}
          onClose={() => setDetailCampaignId(null)}
          onMessage={() => setMessageCampaignId(detailCampaign.id)}
          onToggleBookmark={() => toggleBookmarkFor(detailCampaign)}
          onToggleLike={() => toggleLikeFor(detailCampaign)}
          onWithdraw={onWithdraw}
        />
      )}

      {messageCampaign && (
        <MessageModal
          campaign={messageCampaign}
          onClose={() => setMessageCampaignId(null)}
          onGoToMessages={() => goToMessages(messageCampaign)}
        />
      )}
    </section>
  )
}

function MiniCampaignStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[14px] bg-[#f5f3ef] px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8a8175]">{label}</p>
      <p className="mt-1 truncate text-xs font-black text-[#1f252b]">{value}</p>
    </div>
  )
}

function IconButton({ active = false, icon: Icon, label, onClick }: { active?: boolean; icon: LucideIcon; label: string; onClick: (event: MouseEvent<HTMLButtonElement>) => void }) {
  return (
    <button
      className={`grid size-9 place-items-center rounded-full border bg-white transition hover:border-[#1f252b] hover:text-[#1f252b] ${
        active ? "border-[#1f252b] text-[#1f252b]" : "border-[#ded8cf] text-[#69716b]"
      }`}
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
    >
      <Icon className="size-4" fill={active ? "currentColor" : "none"} aria-hidden="true" />
    </button>
  )
}

function CampaignDetailModal({
  bookmarked,
  campaign,
  liked,
  onApply,
  onClose,
  onMessage,
  onToggleBookmark,
  onToggleLike,
  onWithdraw,
}: {
  bookmarked: boolean
  campaign: CreatorCampaign
  liked: boolean
  onApply: (id: number) => void
  onClose: () => void
  onMessage: () => void
  onToggleBookmark: () => void
  onToggleLike: () => void
  onWithdraw: (id: number) => void
}) {
  useEscapeKey(true, onClose)

  return (
    <div className="fixed inset-0 z-50 bg-[#1f252b]/35 p-3 backdrop-blur-sm" onClick={onClose}>
      <div className="mx-auto flex max-h-full max-w-4xl flex-col overflow-hidden rounded-[16px] border border-[#e8e2d9] bg-[#fbfaf7] shadow-[0_24px_80px_rgba(31,37,43,0.2)]" onClick={(event) => event.stopPropagation()}>
        <div className="relative h-52 shrink-0 bg-[#eee8df] bg-cover bg-center" style={{ backgroundImage: `url(${campaignImage(campaign)})` }}>
          <div className="absolute inset-0 bg-gradient-to-t from-[#1f252b]/70 via-[#1f252b]/20 to-transparent" />
          <button className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-white text-[#1f252b]" type="button" aria-label="Close campaign details" onClick={onClose}>
            <X className="size-4" aria-hidden="true" />
          </button>
          <div className="absolute bottom-4 left-4 right-4">
            <div className="mb-2 flex flex-wrap gap-2">
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${statusClass(campaign.status)}`}>{campaign.status.replace("_", " ")}</span>
              <span className="rounded-full bg-white/92 px-2.5 py-1 text-[11px] font-black text-[#1f252b]">{campaign.match}% fit</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">{campaign.title}</h2>
            <p className="mt-1 text-sm font-bold text-white/85">{campaign.brand} / {campaign.platform}</p>
          </div>
        </div>

        <div className="overflow-y-auto p-5">
          <div className="grid gap-3 md:grid-cols-4">
            <MiniCampaignStat label="Budget" value={money(campaign.budget)} />
            <MiniCampaignStat label="Reach" value={campaign.reach > 0 ? `${Math.round(campaign.reach / 1000)}K` : "0"} />
            <MiniCampaignStat label="Country" value={campaign.country} />
            <MiniCampaignStat label="Deadline" value={campaign.deadline} />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_240px]">
            <div>
              <h3 className="text-sm font-black text-[#1f252b]">Campaign brief</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#505852]">{campaign.brief}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-[#f0ece5] px-3 py-1.5 text-xs font-black text-[#69716b]">{campaign.niche}</span>
                <span className="rounded-full bg-[#f0ece5] px-3 py-1.5 text-xs font-black text-[#69716b]">{campaign.platform}</span>
                <span className="rounded-full bg-[#f0ece5] px-3 py-1.5 text-xs font-black text-[#69716b]">{campaign.country}</span>
              </div>
            </div>

            <div className="rounded-[12px] border border-[#e8e2d9] bg-white p-3">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#8a8175]">Actions</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button className={`h-10 rounded-[10px] border text-xs font-black ${liked ? "border-[#1f252b] text-[#1f252b]" : "border-[#ded8cf] text-[#69716b]"}`} type="button" onClick={onToggleLike}>
                  Like
                </button>
                <button className={`h-10 rounded-[10px] border text-xs font-black ${bookmarked ? "border-[#1f252b] text-[#1f252b]" : "border-[#ded8cf] text-[#69716b]"}`} type="button" onClick={onToggleBookmark}>
                  Save
                </button>
                <button className="h-10 rounded-[10px] border border-[#ded8cf] text-xs font-black text-[#69716b] col-span-2" type="button" onClick={onMessage}>
                  Message
                </button>
              </div>
              {campaign.status === "NOT_APPLIED" && (
                <Button className="mt-3 h-10 w-full rounded-full bg-[#1f252b] text-xs font-black text-white hover:bg-[#363d43]" type="button" onClick={() => onApply(campaign.id)}>
                  Apply now
                </Button>
              )}
              {campaign.status === "PENDING" && (
                <Button className="mt-3 h-10 w-full rounded-full border-[#ded8cf] text-xs font-black text-[#9b6500]" variant="outline" type="button" onClick={() => onWithdraw(campaign.id)}>
                  Withdraw application
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MessageModal({
  campaign,
  onClose,
  onGoToMessages,
}: {
  campaign: CreatorCampaign
  onClose: () => void
  onGoToMessages: () => void
}) {
  const unlocked = campaign.status === "ACCEPTED"
  useEscapeKey(true, onClose)

  return (
    <div className="fixed inset-0 z-50 bg-[#1f252b]/35 p-3 backdrop-blur-sm" onClick={onClose}>
      <div className="mx-auto max-w-xl overflow-hidden rounded-[16px] border border-[#e8e2d9] bg-[#fbfaf7] shadow-[0_24px_80px_rgba(31,37,43,0.2)]" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#e8e2d9] px-4 py-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8a8175]">Message brand</p>
            <h2 className="text-base font-black text-[#1f252b]">{campaign.brand}</h2>
          </div>
          <button className="grid size-9 place-items-center rounded-full border border-[#ded8cf] bg-white text-[#69716b]" type="button" aria-label="Close message composer" onClick={onClose}>
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="p-4">
          <p className="rounded-[12px] bg-white p-3 text-sm font-semibold leading-5 text-[#505852]">{campaign.title}</p>
          {unlocked ? (
            <div className="mt-3 rounded-[12px] border border-dashed border-[#ded8cf] bg-white p-4 text-center">
              <p className="text-sm font-black text-[#1f252b]">You&apos;re connected with {campaign.brand}</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-[#69716b]">Continue the conversation in your Messages inbox.</p>
              <Button className="mt-3 h-10 rounded-full bg-[#1f252b] px-4 text-xs font-black text-white hover:bg-[#363d43]" type="button" onClick={onGoToMessages}>
                Go to Messages <Send className="size-3.5" aria-hidden="true" />
              </Button>
            </div>
          ) : (
            <div className="mt-3 rounded-[12px] border border-dashed border-[#ded8cf] bg-white p-4 text-center">
              <p className="text-sm font-black text-[#1f252b]">Messaging isn&apos;t open yet</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-[#69716b]">Direct messages with {campaign.brand} unlock once they accept your application to this campaign.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
