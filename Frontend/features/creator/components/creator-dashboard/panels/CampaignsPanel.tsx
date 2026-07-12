"use client"

import { ArrowRight, Bookmark, CalendarDays, Heart, MessageCircle, MessageSquare, Search, Send, X } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { KeyboardEvent, MouseEvent, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { type CreatorCampaign, campaignImage, money, statusClass } from "../creator-dashboard.shared"

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
  const [likedCampaignIds, setLikedCampaignIds] = useState<number[]>([])
  const [bookmarkedCampaignIds, setBookmarkedCampaignIds] = useState<number[]>([])
  const [detailCampaignId, setDetailCampaignId] = useState<number | null>(null)
  const [commentCampaignId, setCommentCampaignId] = useState<number | null>(null)
  const [messageCampaignId, setMessageCampaignId] = useState<number | null>(null)
  const [messageDraft, setMessageDraft] = useState("")
  const [notice, setNotice] = useState("")
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({})
  const [commentsByCampaign, setCommentsByCampaign] = useState<Record<number, string[]>>({})
  const detailCampaign = useMemo(() => campaigns.find((campaign) => campaign.id === detailCampaignId) ?? null, [campaigns, detailCampaignId])
  const commentCampaign = useMemo(() => campaigns.find((campaign) => campaign.id === commentCampaignId) ?? null, [campaigns, commentCampaignId])
  const messageCampaign = useMemo(() => campaigns.find((campaign) => campaign.id === messageCampaignId) ?? null, [campaigns, messageCampaignId])

  function toggleId(ids: number[], id: number) {
    return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]
  }

  function stopCardClick(event: MouseEvent<HTMLElement>) {
    event.stopPropagation()
  }

  function toggleLike(event: MouseEvent<HTMLButtonElement>, campaign: CreatorCampaign) {
    stopCardClick(event)
    setLikedCampaignIds((current) => toggleId(current, campaign.id))
    setNotice(`${campaign.title} ${likedCampaignIds.includes(campaign.id) ? "removed from liked campaigns" : "added to liked campaigns"}.`)
  }

  function toggleBookmark(event: MouseEvent<HTMLButtonElement>, campaign: CreatorCampaign) {
    stopCardClick(event)
    setBookmarkedCampaignIds((current) => toggleId(current, campaign.id))
    setNotice(`${campaign.title} ${bookmarkedCampaignIds.includes(campaign.id) ? "removed from saved campaigns" : "saved to bookmarks"}.`)
  }

  function openComments(event: MouseEvent<HTMLButtonElement>, campaign: CreatorCampaign) {
    stopCardClick(event)
    setCommentCampaignId(campaign.id)
  }

  function openMessage(event: MouseEvent<HTMLButtonElement>, campaign: CreatorCampaign) {
    stopCardClick(event)
    setMessageCampaignId(campaign.id)
    setMessageDraft(`Hi ${campaign.brand}, I am interested in your "${campaign.title}" campaign.`)
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

  function submitComment(campaign: CreatorCampaign) {
    const comment = commentDrafts[campaign.id]?.trim()
    if (!comment) return

    setCommentsByCampaign((current) => ({
      ...current,
      [campaign.id]: [...(current[campaign.id] ?? []), comment],
    }))
    setCommentDrafts((current) => ({ ...current, [campaign.id]: "" }))
    setNotice(`Comment added to ${campaign.title}.`)
  }

  function sendMessageToBrand() {
    if (!messageCampaign || !messageDraft.trim()) return

    onMessageBrand(messageCampaign.id, messageDraft)
    setNotice(`Message sent to ${messageCampaign.brand}. You can continue the thread in Messages.`)
    setMessageCampaignId(null)
    setMessageDraft("")
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
          const commentCount = commentsByCampaign[campaign.id]?.length ?? 0

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
                <MiniCampaignStat label="Reach" value={`${Math.round(campaign.reach / 1000)}K`} />
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
                  <IconButton label={`Comments${commentCount ? ` (${commentCount})` : ""}`} icon={MessageCircle} onClick={(event) => openComments(event, campaign)} />
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
          onComment={() => setCommentCampaignId(detailCampaign.id)}
          onMessage={() => {
            setMessageCampaignId(detailCampaign.id)
            setMessageDraft(`Hi ${detailCampaign.brand}, I am interested in your "${detailCampaign.title}" campaign.`)
          }}
          onToggleBookmark={() => setBookmarkedCampaignIds((current) => toggleId(current, detailCampaign.id))}
          onToggleLike={() => setLikedCampaignIds((current) => toggleId(current, detailCampaign.id))}
          onWithdraw={onWithdraw}
        />
      )}

      {commentCampaign && (
        <CommentModal
          campaign={commentCampaign}
          comments={commentsByCampaign[commentCampaign.id] ?? []}
          draft={commentDrafts[commentCampaign.id] ?? ""}
          onChange={(value) => setCommentDrafts((current) => ({ ...current, [commentCampaign.id]: value }))}
          onClose={() => setCommentCampaignId(null)}
          onSubmit={() => submitComment(commentCampaign)}
        />
      )}

      {messageCampaign && (
        <MessageModal
          campaign={messageCampaign}
          message={messageDraft}
          onChange={setMessageDraft}
          onClose={() => setMessageCampaignId(null)}
          onSend={sendMessageToBrand}
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
  onComment,
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
  onComment: () => void
  onMessage: () => void
  onToggleBookmark: () => void
  onToggleLike: () => void
  onWithdraw: (id: number) => void
}) {
  return (
    <div className="fixed inset-0 z-50 bg-[#1f252b]/35 p-3 backdrop-blur-sm">
      <div className="mx-auto flex max-h-full max-w-4xl flex-col overflow-hidden rounded-[16px] border border-[#e8e2d9] bg-[#fbfaf7] shadow-[0_24px_80px_rgba(31,37,43,0.2)]">
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
            <MiniCampaignStat label="Reach" value={`${Math.round(campaign.reach / 1000)}K`} />
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
                <button className="h-10 rounded-[10px] border border-[#ded8cf] text-xs font-black text-[#69716b]" type="button" onClick={onComment}>
                  Comment
                </button>
                <button className="h-10 rounded-[10px] border border-[#ded8cf] text-xs font-black text-[#69716b]" type="button" onClick={onMessage}>
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

function CommentModal({
  campaign,
  comments,
  draft,
  onChange,
  onClose,
  onSubmit,
}: {
  campaign: CreatorCampaign
  comments: string[]
  draft: string
  onChange: (value: string) => void
  onClose: () => void
  onSubmit: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 bg-[#1f252b]/35 p-3 backdrop-blur-sm">
      <div className="mx-auto flex max-h-full max-w-xl flex-col overflow-hidden rounded-[16px] border border-[#e8e2d9] bg-[#fbfaf7] shadow-[0_24px_80px_rgba(31,37,43,0.2)]">
        <div className="flex items-center justify-between border-b border-[#e8e2d9] px-4 py-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8a8175]">Comments</p>
            <h2 className="text-base font-black text-[#1f252b]">{campaign.title}</h2>
          </div>
          <button className="grid size-9 place-items-center rounded-full border border-[#ded8cf] bg-white text-[#69716b]" type="button" aria-label="Close comments" onClick={onClose}>
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="min-h-40 flex-1 overflow-y-auto p-4">
          {comments.length === 0 ? (
            <p className="rounded-[12px] border border-dashed border-[#ded8cf] bg-white p-4 text-sm font-semibold text-[#69716b]">No comments yet.</p>
          ) : (
            <div className="grid gap-2">
              {comments.map((comment, index) => (
                <p key={`${comment}-${index}`} className="rounded-[12px] bg-white px-3 py-2 text-sm font-semibold text-[#505852]">{comment}</p>
              ))}
            </div>
          )}
        </div>
        <div className="border-t border-[#e8e2d9] p-4">
          <textarea className="min-h-24 w-full rounded-[12px] border border-[#ded8cf] bg-white p-3 text-sm font-semibold text-[#1f252b] outline-none focus:border-[#1f252b]" value={draft} onChange={(event) => onChange(event.target.value)} placeholder="Write a comment..." />
          <Button className="mt-3 h-10 rounded-full bg-[#1f252b] px-4 text-xs font-black text-white hover:bg-[#363d43]" type="button" disabled={!draft.trim()} onClick={onSubmit}>
            Add comment
          </Button>
        </div>
      </div>
    </div>
  )
}

function MessageModal({
  campaign,
  message,
  onChange,
  onClose,
  onSend,
}: {
  campaign: CreatorCampaign
  message: string
  onChange: (value: string) => void
  onClose: () => void
  onSend: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 bg-[#1f252b]/35 p-3 backdrop-blur-sm">
      <div className="mx-auto max-w-xl overflow-hidden rounded-[16px] border border-[#e8e2d9] bg-[#fbfaf7] shadow-[0_24px_80px_rgba(31,37,43,0.2)]">
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
          <textarea className="mt-3 min-h-32 w-full rounded-[12px] border border-[#ded8cf] bg-white p-3 text-sm font-semibold text-[#1f252b] outline-none focus:border-[#1f252b]" value={message} onChange={(event) => onChange(event.target.value)} placeholder="Write your message..." />
          <Button className="mt-3 h-10 rounded-full bg-[#1f252b] px-4 text-xs font-black text-white hover:bg-[#363d43]" type="button" disabled={!message.trim()} onClick={onSend}>
            Send message <Send className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  )
}
