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
  ChevronDown,
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
import { FormEvent, ReactNode, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api-client"
import { useClickOutside } from "@/hooks/useClickOutside"
import { useEscapeKey } from "@/hooks/useEscapeKey"
import {
  MarketplaceApplication as Application,
  MarketplaceCampaign as Campaign,
  MarketplaceCollaboration as Collaboration,
  ApplicationStatus,
  CreatorDiscoveryDecision,
} from "@/features/shared/marketplaceStore"
import {
  type Activity,
  type Creator,
  creatorImage,
  creatorKey,
  creatorWorkSamples,
  campaignImage,
  money,
  statusClass,
} from "../brand-dashboard.shared"

// `metricSets` and `awardSets` used to live here: hardcoded fake follower/engagement values and
// category tags, cycled onto cards by `index % length`. They were never wired to any API - the
// impossible "132.94%" engagement rate was a literal constant, and that's why the same numbers
// repeated across unrelated creators. Deleted rather than kept: the card now shows only fields we
// actually have from the provider, and omits the rest. Do not reintroduce placeholder metrics on a
// card that also carries the "Unverified estimate from public data" label - that combination
// presents invented numbers as real scraped data.

function creatorInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  // Array.from (not charAt) so emoji/surrogate pairs in display names like "Nepli🥵Girls"
  // don't get sliced into a broken half-character.
  const letters = words.slice(0, 2).map((word) => Array.from(word)[0] ?? "").join("")
  return letters.toUpperCase() || "?"
}

/** Avatar that degrades to initials instead of ever showing someone else's face.
 *
 * `creator.image` is a REAL platform CDN url or null. Those urls are short-lived signed links
 * (~24h) on both IG and TikTok, so a stale row's avatar will 403/404 - hence onError -> initials.
 * `referrerPolicy="no-referrer"` because the IG/TikTok CDNs can reject hotlinked requests that
 * carry a foreign Referer.
 */
function CreatorAvatar({ creator, className }: { creator: Creator; className: string }) {
  const [broken, setBroken] = useState(false)

  if (!creator.image || broken) {
    return (
      <div className={`${className} grid place-items-center bg-[#eee8df] font-black text-[#8a8175]`}>
        {creatorInitials(creator.name)}
      </div>
    )
  }
  return (
    <div className={`${className} overflow-hidden bg-[#eee8df]`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={creator.image}
        alt=""
        className="h-full w-full object-cover"
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
      />
    </div>
  )
}

/** Short platform badge (IG/TT/YT) for a creator's primary platform. */
function platformBadge(creator: Creator) {
  const platform = creator.platforms?.[0]?.toLowerCase()
  if (platform === "instagram") return "IG"
  if (platform === "tiktok") return "TT"
  if (platform === "youtube") return "YT"
  return "--"
}

function socialTone(platform: string) {
  if (platform === "IG") return "text-[#ff3aa6]"
  if (platform === "YT") return "text-[#e11d48]"
  return "text-[#111827]"
}

export function DiscoverPanel({
  creators,
  discoveryDecisions,
  filter,
  search,
  selectedCreator,
  onDiscoveryDecision,
  onFilter,
  onSearch,
  onSelect,
  onShortlist,
}: {
  creators: Creator[]
  discoveryDecisions: CreatorDiscoveryDecision[]
  filter: "ALL" | "NP" | "IN"
  search: string
  selectedCreator: Creator | null
  onDiscoveryDecision: (creator: Creator, status: CreatorDiscoveryDecision["status"]) => void
  onFilter: (filter: "ALL" | "NP" | "IN") => void
  onSearch: (search: string) => void
  onSelect: (creator: Creator) => void
  onShortlist: (name: string) => void
}) {
  const [view, setView] = useState<"find" | "selected" | "rejected" | "lookalikes">("find")
  const [notice, setNotice] = useState("")
  const [platformFilterOpen, setPlatformFilterOpen] = useState(false)
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false)
  const [instagramFilter, setInstagramFilter] = useState(false)
  const [selectedPlatforms, setSelectedPlatforms] = useState<ConnectedPlatform[]>([])
  const [contactCreator, setContactCreator] = useState<Creator | null>(null)
  const [profileCreator, setProfileCreator] = useState<Creator | null>(null)
  const [contactTab, setContactTab] = useState<"channels" | "email" | "notes" | "profile">("channels")
  const [emailSubject, setEmailSubject] = useState("")
  const [emailBody, setEmailBody] = useState("")
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [movingDecision, setMovingDecision] = useState<{ handle: string; status: CreatorDiscoveryDecision["status"] } | null>(null)
  const knownHandles = new Set(creators.map((creator) => creator.handle))
  const selectedHandles = discoveryDecisions
    .filter((decision) => decision.status === "SELECTED" && knownHandles.has(decision.handle))
    .map((decision) => decision.handle)
  const rejectedHandles = discoveryDecisions
    .filter((decision) => decision.status === "REJECTED" && knownHandles.has(decision.handle))
    .map((decision) => decision.handle)

  const visibleCreators = creators.filter((creator) => {
    const connectedPlatforms = getCreatorPlatforms(creator)
    const platformMatches = selectedPlatforms.length === 0 || selectedPlatforms.some((platform) => connectedPlatforms.includes(platform))

    if (!platformMatches) return false
    if (view === "selected") return selectedHandles.includes(creator.handle)
    if (view === "rejected") return rejectedHandles.includes(creator.handle)
    if (view === "lookalikes") return selectedCreator ? creator.niche === selectedCreator.niche && creator.handle !== selectedCreator.handle : false
    return true
  })

  const activePlatformLabel = selectedPlatforms.length === 0
    ? "All channels"
    : selectedPlatforms.length === 1
      ? platformLabels[selectedPlatforms[0]].label
      : `${selectedPlatforms.length} channels`

  function moveCreator(creator: Creator, status: CreatorDiscoveryDecision["status"]) {
    setMovingDecision({ handle: creator.handle, status })
    window.setTimeout(() => {
      onDiscoveryDecision(creator, status)
      setMovingDecision((current) => (current?.handle === creator.handle ? null : current))
    }, 180)
  }

  function openProfile(creator: Creator) {
    onSelect(creator)
    setProfileCreator(creator)
  }

  function selectCreator(creator: Creator) {
    onSelect(creator)
    moveCreator(creator, "SELECTED")
    onShortlist(creator.name)
    setNotice(`${creator.name} added to selected creators.`)
  }

  function rejectCreator(creator: Creator) {
    moveCreator(creator, "REJECTED")
    setNotice(`${creator.name} moved to rejected.`)
  }

  function openContact(creator: Creator) {
    selectCreator(creator)
    setContactCreator(creator)
    setContactTab("channels")
    setEmailSubject(`Collaboration opportunity from Nepfluence`)
    setEmailBody(`Hi ${creator.name},\n\nWe are interested in working with you on an upcoming creator campaign. Your ${creator.niche} content looks like a strong fit for our brand.\n\nWould you be open to discussing the brief?\n\nThanks,\nNepfluence brand team`)
  }

  // Discovery-sourced creators (isOnboarded: false) have no Nepfluence account yet, so the
  // real in-app contact/messaging flow (openContact -> ContactModal) doesn't apply to them -
  // there's no user_id to message. Instead, this opens their public platform profile so the
  // brand can reach out directly and invite them to join. No automated-invite backend exists
  // yet, so this deliberately doesn't claim to send one.
  function externalProfileUrl(creator: Creator): string | null {
    const platform = creator.platforms?.[0]
    const bareHandle = creator.handle.replace(/^@/, "")
    if (platform === "instagram") return `https://instagram.com/${bareHandle}`
    if (platform === "tiktok") return `https://www.tiktok.com/@${bareHandle}`
    if (platform === "youtube") {
      return `https://www.youtube.com/${bareHandle.startsWith("UC") ? `channel/${bareHandle}` : `@${bareHandle}`}`
    }
    return null
  }

  function inviteDiscoveredCreator(creator: Creator) {
    const url = externalProfileUrl(creator)
    if (url) window.open(url, "_blank", "noopener,noreferrer")
    setNotice(`Opened ${creator.name}'s profile — reach out to invite them to Nepfluence.`)
  }

  async function sendEmail() {
    if (!contactCreator || !emailSubject.trim() || !emailBody.trim()) return

    setIsSendingEmail(true)
    try {
      await apiClient<{ message: string; delivery: string }>("/api/contact/creator-email", {
        method: "POST",
        body: JSON.stringify({
          creator_name: contactCreator.name,
          creator_handle: contactCreator.handle,
          subject: emailSubject.trim(),
          message: emailBody.trim(),
        }),
      })
      onShortlist(contactCreator.name)
      setNotice(`Email outreach saved for ${contactCreator.name}.`)
      setContactCreator(null)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to save email outreach.")
    } finally {
      setIsSendingEmail(false)
    }
  }

  function clearFilters() {
    onSearch("")
    onFilter("ALL")
    setInstagramFilter(false)
    setSelectedPlatforms([])
    setNotice("Filters cleared.")
  }

  function togglePlatform(platform: ConnectedPlatform) {
    setSelectedPlatforms((current) => {
      const next = current.includes(platform)
        ? current.filter((selectedPlatform) => selectedPlatform !== platform)
        : [...current, platform]
      setInstagramFilter(next.includes("instagram"))
      return next
    })
  }

  return (
    <section className="min-h-[calc(100vh-132px)] bg-[#f5f3ef]">
      <div className="sticky top-0 z-20 rounded-b-[22px] border border-t-0 border-[#e8e2d9] bg-[#fbfaf7]/95 px-4 py-3 backdrop-blur">
        <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-[#e8e2d9] pb-3">
          <TopTab active={view === "find"} label="Find creators" count={visibleCreators.length} onClick={() => setView("find")} />
          <TopTab active={view === "selected"} label="Selected" count={selectedHandles.length} onClick={() => setView("selected")} />
          <TopTab active={view === "rejected"} label="Rejected" count={rejectedHandles.length} onClick={() => setView("rejected")} />
          <TopTab active={view === "lookalikes"} label="Lookalikes" count={0} onClick={() => setView("lookalikes")} />
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="flex min-w-44 items-center gap-2">
            <h2 className="text-base font-black text-[#1f252b]">Creator discovery</h2>
            <ChevronRight className="size-4 text-[#8a8175]" aria-hidden="true" />
          </div>

          <label className="flex h-11 flex-1 items-center gap-3 rounded-full border border-[#ded8cf] bg-white px-4 text-sm font-semibold text-[#69716b] shadow-sm">
            <Search className="size-4 text-[#8a8175]" aria-hidden="true" />
            <input
              className="h-full w-full bg-transparent outline-none placeholder:text-[#98a2b3]"
              value={search}
              onChange={(event) => onSearch(event.target.value)}
              placeholder="Search creators by niche, handle, country, or content style"
            />
          </label>

          <div className="relative flex flex-wrap gap-2">
            <button
              className={`inline-flex h-11 min-w-[180px] items-center justify-between gap-3 rounded-full border bg-white px-4 text-xs font-black shadow-sm transition ${
                platformFilterOpen ? "border-[#1f252b] text-[#1f252b] ring-4 ring-[#ede8df]" : "border-[#ded8cf] text-[#69716b] hover:border-[#b8afa3]"
              }`}
              type="button"
              onClick={() => {
                setPlatformFilterOpen((open) => !open)
                setMoreFiltersOpen(false)
              }}
            >
              <span className="inline-flex items-center gap-2">
                <span className={`grid size-6 place-items-center rounded-full bg-[#f0ece5] text-[10px] font-black ${selectedPlatforms[0] ? platformLabels[selectedPlatforms[0]].tone : "text-[#69716b]"}`}>
                  {selectedPlatforms[0] ? platformLabels[selectedPlatforms[0]].badge : "ALL"}
                </span>
                {activePlatformLabel}
              </span>
              <ChevronDown className={`size-4 transition ${platformFilterOpen ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>

            <button
              className={`inline-flex h-11 items-center gap-2 rounded-full border bg-white px-4 text-xs font-black shadow-sm transition ${
                moreFiltersOpen ? "border-[#1f252b] text-[#1f252b] ring-4 ring-[#ede8df]" : "border-[#ded8cf] text-[#69716b] hover:border-[#b8afa3]"
              }`}
              type="button"
              onClick={() => {
                setMoreFiltersOpen((open) => !open)
                setPlatformFilterOpen(false)
              }}
            >
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              More filters
            </button>

            {platformFilterOpen && (
              <PlatformFilterPopover
                selectedPlatforms={selectedPlatforms}
                onClear={clearFilters}
                onClose={() => setPlatformFilterOpen(false)}
                onTogglePlatform={togglePlatform}
              />
            )}

            {moreFiltersOpen && (
              <MoreFiltersPopover
                filter={filter}
                onClear={clearFilters}
                onClose={() => setMoreFiltersOpen(false)}
                onCountryChange={onFilter}
              />
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {instagramFilter && (
            <button className="inline-flex h-8 items-center gap-2 rounded-full bg-white px-3 text-xs font-black text-[#1f252b] shadow-sm ring-1 ring-[#e8e2d9]" type="button" onClick={() => setInstagramFilter(false)}>
              <span className="grid size-4 place-items-center rounded-full bg-[#ff4ea8] text-[10px] text-white">IG</span>
              Instagram
              <X className="size-3.5 text-[#98a2b3]" aria-hidden="true" />
            </button>
          )}
          <button className="h-8 rounded-full px-3 text-xs font-black text-[#505852]" type="button" onClick={clearFilters}>
            Clear all filters
          </button>
          <span className="inline-flex h-8 items-center rounded-full bg-[#f0ece5] px-3 text-xs font-black text-[#69716b]">
            Search, channel, and country filters are active in this MVP.
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-4 py-4">
        {notice && <p className="mb-3 rounded-[16px] bg-[#f0ece5] px-4 py-3 text-sm font-black text-[#1f252b]">{notice}</p>}

        <div className="grid gap-3">
          {visibleCreators.map((creator, index) => {
            const samples = creatorWorkSamples.length
              ? [0, 1, 2].map((offset) => creatorWorkSamples[(index + offset) % creatorWorkSamples.length])
              : []
            const isSelected = selectedCreator?.handle === creator.handle
            const isMoving = movingDecision?.handle === creator.handle

            return (
              <article
                key={`${view}-${creatorKey(creator)}`}
                className={`creator-result-card grid gap-4 rounded-[24px] bg-[#fbfaf7] p-3 transition hover:bg-white xl:grid-cols-[128px_minmax(245px,1fr)_292px_160px_180px_124px] xl:items-center ${
                  isSelected ? "ring-2 ring-[#d8d1c7]" : "ring-1 ring-[#e8e2d9]"
                } ${
                  isMoving ? (movingDecision.status === "SELECTED" ? "creator-result-card--selecting" : "creator-result-card--rejecting") : ""
                }`}
              >
                <button className="relative h-32 rounded-[22px] bg-[#eee8df] xl:h-[116px]" type="button" onClick={() => openProfile(creator)}>
                  <CreatorAvatar creator={creator} className="h-full rounded-[22px] text-2xl" />
                  <span className="absolute bottom-2 left-1/2 flex -translate-x-1/2 rounded-full bg-white/95 shadow-sm ring-1 ring-[#e8e2d9]">
                    <span className="group relative grid h-8 w-9 place-items-center rounded-l-full text-[#ef4444] transition hover:bg-[#ef4444] hover:text-white" onClick={(event) => { event.stopPropagation(); rejectCreator(creator) }}>
                      <X className="size-4" aria-hidden="true" />
                      <span className="pointer-events-none absolute -top-11 left-1/2 z-30 hidden -translate-x-1/2 whitespace-nowrap rounded-[8px] bg-[#101828] px-3 py-2 text-xs font-black text-white shadow-lg group-hover:block">
                        Reject creator from this list
                      </span>
                    </span>
                    <span className="h-8 w-px bg-[#eef1f5]" />
                    <span className="group relative grid h-8 w-9 place-items-center rounded-r-full text-[#10b981] transition hover:bg-[#10b981] hover:text-white" onClick={(event) => { event.stopPropagation(); selectCreator(creator) }}>
                      <CheckCircle2 className="size-4" aria-hidden="true" />
                      <span className="pointer-events-none absolute -top-11 left-1/2 z-30 hidden -translate-x-1/2 whitespace-nowrap rounded-[8px] bg-[#101828] px-3 py-2 text-xs font-black text-white shadow-lg group-hover:block">
                        Select creator for review
                      </span>
                    </span>
                  </span>
                </button>

                <div className="min-w-0 border-[#e8e2d9] xl:border-r xl:pr-5">
                  <button className="block w-full text-left" type="button" onClick={() => openProfile(creator)}>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-[15px] font-black text-[#1f252b]">{creator.name}</h3>
                      {creator.country && (
                        <span className="rounded-full bg-[#f0ece5] px-2 py-0.5 text-[10px] font-black text-[#69716b]">{creator.country}</span>
                      )}
                      {creator.isOnboarded === false && (
                        <span className="rounded-full bg-[#fff5df] px-2 py-0.5 text-[10px] font-black text-[#9b6500]">
                          Not on Nepfluence
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs font-black text-[#8a8175]">{creator.handle}</p>
                    {creator.isOnboarded === false ? (
                      <p className="mt-3 max-w-xl text-[13px] font-medium leading-5 text-[#69716b]">
                        Unverified estimate from public data
                        {creator.statsAsOf ? ` — as of ${new Date(creator.statsAsOf).toLocaleDateString()}` : ""}. This creator hasn&apos;t joined Nepfluence yet.
                      </p>
                    ) : (
                      <p className="mt-3 line-clamp-2 max-w-xl text-[13px] font-medium leading-5 text-[#69716b]">
                        {creator.niche} creator available for product demos, brand storytelling, and campaign content.
                      </p>
                    )}
                  </button>
                  <div className="mt-3 flex items-center gap-1.5">
                    <button className="grid size-7 place-items-center rounded-full border border-[#ded8cf] bg-white text-[#1f252b]" type="button" aria-label={`Select ${creator.name}`} onClick={() => selectCreator(creator)}>
                      <UsersRound className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 overflow-hidden">
                  {samples.map((sample) => (
                    <div key={`${creator.handle}-${sample.title}`} className="relative h-[86px] w-[86px] shrink-0 overflow-hidden rounded-[18px] bg-[#eee8df] shadow-sm">
                      <div className="h-full bg-cover bg-center" style={{ backgroundImage: `url(${sample.image})` }} />
                      <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-white text-[8px] font-black text-[#ff4ea8] ring-1 ring-[#f2d7ff]">IG</span>
                    </div>
                  ))}
                </div>

                {/* Real data only. This block previously rendered `metricSets`/`awardSets` -
                    hardcoded constants cycled by array index (that's where the impossible
                    "132.94%" engagement rate came from). They were prototype decoration that was
                    never wired to the API, and showing them beside the "Unverified estimate from
                    public data" label made fabricated numbers read as real scraped data. Anything
                    we don't genuinely have is now shown as unavailable rather than invented. */}
                {/* flex, not a fixed 54px grid column: real follower counts run to 9 digits
                    (129,200,000) and overflowed a fixed column straight through the label. */}
                <div className="grid gap-1.5 text-[12px] font-semibold text-[#505852]">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`grid size-5 shrink-0 place-items-center rounded-full bg-white text-[9px] font-black ring-1 ring-[#e8e2d9] ${socialTone(platformBadge(creator))}`}>
                      {platformBadge(creator)}
                    </span>
                    <span className="font-black text-[#1f252b]">
                      {creator.followers && creator.followers !== "0" ? creator.followers : "—"}
                    </span>
                    <span className="text-[#8a8175]">followers</span>
                  </div>
                  {creator.engagementRate != null && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <FileText className="size-3 shrink-0 text-[#8a8175]" aria-hidden="true" />
                      <span className="font-black text-[#1f252b]">{creator.engagementRate}%</span>
                      <span className="text-[#8a8175]">engagement</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 xl:justify-end">
                  {creator.isOnboarded === false ? (
                    <button
                      className="inline-flex h-9 items-center gap-2 rounded-full bg-[#1f252b] px-4 text-xs font-black text-white shadow-[0_8px_18px_rgba(31,37,43,0.16)]"
                      type="button"
                      onClick={() => inviteDiscoveredCreator(creator)}
                    >
                      <Send className="size-3.5" aria-hidden="true" />
                      Invite to Nepfluence
                    </button>
                  ) : (
                    <button
                      className="inline-flex h-9 items-center gap-2 rounded-full bg-[#1f252b] px-4 text-xs font-black text-white shadow-[0_8px_18px_rgba(31,37,43,0.16)]"
                      type="button"
                      onClick={() => openContact(creator)}
                    >
                      <Send className="size-3.5" aria-hidden="true" />
                      Contact
                    </button>
                  )}
                </div>
              </article>
            )
          })}
          {visibleCreators.length === 0 && (
            <div className="rounded-[24px] border border-dashed border-[#ded8cf] bg-[#fbfaf7] p-10 text-center">
              <p className="text-lg font-black text-[#1f252b]">{view === "find" ? "No real creators available yet" : "No creators in this section yet"}</p>
              <p className="mt-2 text-sm font-semibold text-[#69716b]">{view === "find" ? "Creator profiles will appear here after real creator accounts complete their profiles." : "Select or reject creators from Find creators to fill this view."}</p>
            </div>
          )}
        </div>
      </div>

      {contactCreator && (
        <ContactModal
          creator={contactCreator}
          emailBody={emailBody}
          emailSubject={emailSubject}
          isSendingEmail={isSendingEmail}
          tab={contactTab}
          onClose={() => setContactCreator(null)}
          onEmailBodyChange={setEmailBody}
          onEmailSubjectChange={setEmailSubject}
          onSendEmail={sendEmail}
          onTabChange={setContactTab}
        />
      )}

      {profileCreator && (
        <CreatorProfileModal
          creator={profileCreator}
          onClose={() => setProfileCreator(null)}
          onContact={() => {
            setProfileCreator(null)
            openContact(profileCreator)
          }}
        />
      )}
    </section>
  )
}

function TopTab({ active, label, count, onClick }: { active: boolean; label: string; count: number; onClick: () => void }) {
  return (
    <button
      className={`inline-flex h-9 items-center gap-2 rounded-[8px] px-3 text-sm font-black transition ${active ? "bg-[#f6efff] text-[#8f3cff]" : "text-[#667085] hover:bg-[#f7f8fb]"}`}
      type="button"
      onClick={onClick}
    >
      {label}
      <span className={`grid size-6 place-items-center rounded-full text-xs ${active ? "bg-[#10b981] text-white" : "bg-[#eef1f5] text-[#667085]"}`}>{count}</span>
    </button>
  )
}

function PlatformFilterPopover({
  selectedPlatforms,
  onClear,
  onClose,
  onTogglePlatform,
}: {
  selectedPlatforms: ConnectedPlatform[]
  onClear: () => void
  onClose: () => void
  onTogglePlatform: (platform: ConnectedPlatform) => void
}) {
  const quickPlatforms = (Object.keys(platformLabels) as ConnectedPlatform[])
  const popoverRef = useRef<HTMLDivElement>(null)
  useClickOutside(true, popoverRef, onClose)
  useEscapeKey(true, onClose)

  return (
    <div ref={popoverRef} className="absolute right-0 top-12 z-40 w-[min(600px,calc(100vw-32px))] overflow-hidden rounded-[18px] border border-[#ded8cf] bg-[#fbfaf7] shadow-[0_22px_70px_rgba(31,37,43,0.16)]">
      <div className="flex items-center justify-between border-b border-[#e8e2d9] px-4 py-3">
        <p className="text-sm font-black text-[#1f252b]">Filter by channel</p>
        <button className="grid size-8 place-items-center rounded-full border border-[#ded8cf] bg-white text-[#69716b] transition hover:border-[#1f252b] hover:text-[#1f252b]" type="button" aria-label="Close filter" onClick={onClose}>
          <X className="size-3.5" aria-hidden="true" />
        </button>
      </div>
      <div className="p-4">
        <p className="text-sm font-black text-[#1f252b]">Search across</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {quickPlatforms.map((platform) => {
            const active = selectedPlatforms.includes(platform)

            return (
              <button
                key={platform}
                className={`grid size-10 place-items-center rounded-full border text-[10px] font-black transition ${
                  active ? "border-[#1f252b] bg-[#1f252b] text-white shadow-sm" : "border-[#ded8cf] bg-white text-[#69716b] hover:border-[#b8afa3]"
                }`}
                type="button"
                onClick={() => onTogglePlatform(platform)}
                title={platformLabels[platform].label}
              >
                {platformLabels[platform].badge}
              </button>
            )
          })}
        </div>
      </div>

      <div className="border-t border-[#e8e2d9] p-4">
        <div className="mb-3 inline-flex items-center gap-2 text-xs font-black text-[#1f252b]">
          <span className="grid size-5 place-items-center rounded-full bg-[#fff0f8] text-[10px] text-[#ff3aa6]">IG</span>
          Instagram
        </div>

        <div className="rounded-[16px] border border-[#ded8cf] bg-white p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <FilterLabel>Followers</FilterLabel>
              <div className="mt-2 flex items-center gap-2">
                <input className="h-9 min-w-0 flex-1 rounded-[10px] border border-[#ded8cf] px-3 text-sm font-semibold outline-none focus:border-[#1f252b]" defaultValue="0" />
                <span className="text-xs font-semibold text-[#98a2b3]">to</span>
                <input className="h-9 min-w-0 flex-1 rounded-[10px] border border-[#ded8cf] px-3 text-sm font-semibold outline-none focus:border-[#1f252b]" defaultValue="∞" />
              </div>
            </div>

            <FilterSlider label="Min. followers growth rate" />
            <FilterSlider label="Min. avg engagement" hasToggle />
            <FilterSlider label="Min. engagement growth" />
          </div>

          <div className="mt-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <FilterLabel>Last activity</FilterLabel>
            <div className="inline-flex rounded-full bg-[#f0ece5] p-1">
              {["Anytime", "Week", "Month", "3 months", "Year"].map((label, index) => (
                <button key={label} className={`h-7 rounded-full px-3 text-[11px] font-black ${index === 0 ? "bg-white text-[#1f252b] shadow-sm" : "text-[#8a8175]"}`} type="button">
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[#e8e2d9] p-4">
        <FilterPromo />
      </div>

      <div className="flex justify-end border-t border-[#e8e2d9] bg-[#f5f3ef] p-3">
        <button className="h-9 rounded-full border border-[#ded8cf] bg-white px-4 text-xs font-black text-[#69716b] transition hover:border-[#1f252b] hover:text-[#1f252b]" type="button" onClick={onClear}>
          Clear all filters
        </button>
      </div>
    </div>
  )
}

function MoreFiltersPopover({
  filter,
  onClear,
  onClose,
  onCountryChange,
}: {
  filter: "ALL" | "NP" | "IN"
  onClear: () => void
  onClose: () => void
  onCountryChange: (filter: "ALL" | "NP" | "IN") => void
}) {
  const popoverRef = useRef<HTMLDivElement>(null)
  useClickOutside(true, popoverRef, onClose)
  useEscapeKey(true, onClose)

  return (
    <div ref={popoverRef} className="absolute right-0 top-12 z-40 w-[min(360px,calc(100vw-32px))] overflow-hidden rounded-[18px] border border-[#ded8cf] bg-[#fbfaf7] shadow-[0_22px_70px_rgba(31,37,43,0.16)]">
      <div className="flex items-center justify-between border-b border-[#e8e2d9] px-4 py-3">
        <h3 className="text-sm font-black text-[#1f252b]">Filter by creator</h3>
        <button className="grid size-8 place-items-center rounded-full border border-[#ded8cf] bg-white text-[#69716b] transition hover:border-[#1f252b] hover:text-[#1f252b]" type="button" aria-label="Close filter" onClick={onClose}>
          <X className="size-3.5" aria-hidden="true" />
        </button>
      </div>
      <div className="p-4">
        <div className="mt-3 divide-y divide-[#e8e2d9]">
          <FilterRow label="Creator country">
            <select
              className="h-9 min-w-[190px] rounded-[10px] border border-[#ded8cf] bg-white px-3 text-xs font-black text-[#69716b] outline-none focus:border-[#1f252b]"
              value={filter}
              onChange={(event) => onCountryChange(event.target.value as "ALL" | "NP" | "IN")}
            >
              <option value="ALL">All countries</option>
              <option value="NP">Nepal</option>
              <option value="IN">India</option>
            </select>
          </FilterRow>
        </div>
      </div>

      <div className="flex justify-end border-t border-[#e8e2d9] bg-[#f5f3ef] p-3">
        <button className="h-9 rounded-full border border-[#ded8cf] bg-white px-4 text-xs font-black text-[#69716b] transition hover:border-[#1f252b] hover:text-[#1f252b]" type="button" onClick={onClear}>
          Clear all filters
        </button>
      </div>
    </div>
  )
}

function FilterLabel({ children }: { children: ReactNode }) {
  return <p className="text-xs font-black text-[#69716b]">{children}</p>
}

function FilterSlider({ hasToggle = false, label }: { hasToggle?: boolean; label: string }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <FilterLabel>{label}</FilterLabel>
        {hasToggle && (
          <span className="inline-flex overflow-hidden rounded-full bg-[#f0ece5] text-[11px] font-black text-[#8a8175]">
            <span className="bg-white px-2 py-1 text-[#1f252b]">%</span>
            <span className="px-2 py-1">#</span>
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <input className="h-1 flex-1 accent-[#1f252b]" type="range" min="0" max="100" defaultValue="0" />
        <div className="inline-flex h-9 overflow-hidden rounded-[10px] border border-[#ded8cf] bg-white text-sm font-black text-[#69716b]">
          <input className="w-12 bg-transparent px-3 outline-none" defaultValue="0" />
          <span className="grid w-9 place-items-center bg-[#f0ece5]">%</span>
        </div>
      </div>
    </div>
  )
}

function FilterRow({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="flex flex-col gap-2 py-3 md:flex-row md:items-center md:justify-between">
      <span className="text-sm font-semibold text-[#69716b]">{label}</span>
      {children}
    </div>
  )
}

function FilterPromo() {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[16px] border border-[#ded8cf] bg-white p-3">
      <div>
        <p className="text-sm font-black text-[#1f252b]">Elevate your influencer matches</p>
        <p className="mt-1 text-xs font-semibold text-[#69716b]">Use saved filters to refine search and outreach.</p>
      </div>
      <button className="h-9 shrink-0 rounded-full border border-[#ded8cf] px-3 text-xs font-black text-[#69716b]" type="button">
        7-day trial
      </button>
    </div>
  )
}

function ContactModal({
  creator,
  emailBody,
  emailSubject,
  isSendingEmail,
  tab,
  onClose,
  onEmailBodyChange,
  onEmailSubjectChange,
  onSendEmail,
  onTabChange,
}: {
  creator: Creator
  emailBody: string
  emailSubject: string
  isSendingEmail: boolean
  tab: "channels" | "email" | "notes" | "profile"
  onClose: () => void
  onEmailBodyChange: (value: string) => void
  onEmailSubjectChange: (value: string) => void
  onSendEmail: () => void
  onTabChange: (tab: "channels" | "email" | "notes" | "profile") => void
}) {
  useEscapeKey(true, onClose)

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#1f252b]/30 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <div className="flex h-[min(720px,92vh)] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-[#e8e2d9] bg-[#fbfaf7] shadow-[0_24px_80px_rgba(31,37,43,0.22)]" onClick={(event) => event.stopPropagation()}>
        <div className="flex h-14 items-center justify-between border-b border-[#e8e2d9] px-4">
          <div className="flex items-center gap-2">
            <ModalTab active={tab === "channels"} label="Channels" onClick={() => onTabChange("channels")} />
            <ModalTab active={tab === "email"} label="Email" onClick={() => onTabChange("email")} />
            <ModalTab active={tab === "notes"} label="Notes" onClick={() => onTabChange("notes")} />
            <ModalTab active={tab === "profile"} label="Profile" onClick={() => onTabChange("profile")} />
          </div>
          <button className="grid size-8 place-items-center rounded-full border border-[#ded8cf] text-[#69716b] transition hover:bg-[#f0ece5]" type="button" aria-label="Close contact modal" onClick={onClose}>
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[240px_1fr]">
          <aside className="border-r border-[#e8e2d9] p-4">
            <h2 className="text-base font-black text-[#1f252b]">Contact {creator.name}</h2>
            <p className="mt-1 text-xs font-semibold text-[#69716b]">{creator.handle} - {creator.niche}</p>
            <div className="mt-4 flex items-center gap-3 rounded-[20px] bg-white p-3 ring-1 ring-[#e8e2d9]">
              <CreatorAvatar creator={creator} className="size-12 rounded-full text-sm shadow-sm" />
              <div>
                <p className="text-sm font-black text-[#1f252b]">{creator.country ?? "Country unknown"}</p>
                <p className="text-xs font-semibold text-[#69716b]">Creator profile</p>
              </div>
            </div>
          </aside>

          <section className="min-h-0 p-5">
            {tab === "channels" && (
              <div className="mx-auto flex h-full max-w-sm flex-col items-center justify-center text-center">
                <CreatorAvatar creator={creator} className="size-20 rounded-full text-xl shadow-[0_14px_32px_rgba(15,23,42,0.16)] ring-4 ring-white" />
                <h3 className="mt-5 text-lg font-black text-[#1f252b]">Ready to team up with {creator.name}?</h3>
                <p className="mt-2 text-xs font-semibold leading-5 text-[#69716b]">
                  Prepare an email outreach draft for this creator, or learn how in-app messaging unlocks.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <button className="h-10 rounded-full bg-[#1f252b] px-4 text-xs font-black text-white shadow-[0_10px_22px_rgba(31,37,43,0.16)]" type="button" onClick={() => onTabChange("email")}>
                    Email creator
                  </button>
                  <button className="h-10 rounded-full border border-[#ded8cf] px-4 text-xs font-black text-[#505852] transition hover:bg-white" type="button" onClick={() => onTabChange("notes")}>
                    In-app message
                  </button>
                </div>
              </div>
            )}

            {tab === "email" && (
              <div className="mx-auto max-w-xl">
                <p className="text-xs font-semibold text-[#69716b]">To {creator.name}</p>
                <input className="mt-3 h-10 w-full rounded-full border border-[#ded8cf] px-4 text-sm font-semibold outline-none focus:border-[#1f252b]" value={emailSubject} onChange={(event) => onEmailSubjectChange(event.target.value)} placeholder="Subject" />
                <textarea className="mt-3 min-h-56 w-full resize-none rounded-[20px] border border-[#ded8cf] px-4 py-3 text-sm font-semibold leading-6 outline-none focus:border-[#1f252b]" value={emailBody} onChange={(event) => onEmailBodyChange(event.target.value)} placeholder="Write your email" />
                <div className="mt-3 flex justify-end">
                  <button className="h-10 rounded-full bg-[#1f252b] px-4 text-xs font-black text-white disabled:bg-[#ded8cf]" disabled={isSendingEmail || !emailSubject.trim() || !emailBody.trim()} type="button" onClick={onSendEmail}>
                    {isSendingEmail ? "Saving..." : "Send email"}
                  </button>
                </div>
              </div>
            )}

            {tab === "notes" && (
              <div className="mx-auto max-w-xl">
                <div className="rounded-[20px] border border-dashed border-[#ded8cf] bg-white p-5 text-center">
                  <p className="text-sm font-black text-[#1f252b]">In-app messaging isn&apos;t open yet with {creator.name}</p>
                  <p className="mt-2 text-xs font-semibold leading-5 text-[#69716b]">
                    Direct messages unlock once you&apos;ve invited {creator.name} to a campaign and accepted their application. Use email outreach for now to start the conversation.
                  </p>
                  <button className="mt-4 h-10 rounded-full bg-[#1f252b] px-4 text-xs font-black text-white" type="button" onClick={() => onTabChange("email")}>
                    Email instead
                  </button>
                </div>
              </div>
            )}

            {tab === "profile" && (
              <div className="mx-auto max-w-xl">
                <h3 className="text-xl font-black text-[#1f252b]">{creator.name}</h3>
                <p className="mt-1 text-xs font-black text-[#505852]">{creator.handle}</p>
                <p className="mt-4 text-sm font-semibold leading-6 text-[#69716b]">
                  {creator.niche} creator available for product demos, brand storytelling, and campaign content.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#f2f4f7] px-3 py-1.5 text-xs font-black text-[#344054]">{creator.niche}</span>
                  {creator.country && (
                    <span className="rounded-full bg-[#f2f4f7] px-3 py-1.5 text-xs font-black text-[#344054]">{creator.country}</span>
                  )}
                  <span className="rounded-full bg-[#f2f4f7] px-3 py-1.5 text-xs font-black text-[#344054]">Brand fit</span>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

type ConnectedPlatform = "instagram" | "youtube" | "tiktok" | "x" | "twitch" | "pinterest" | "blog"

const platformLabels: Record<ConnectedPlatform, { label: string; badge: string; tone: string }> = {
  instagram: { label: "Instagram", badge: "IG", tone: "text-[#ff3aa6]" },
  youtube: { label: "YouTube", badge: "YT", tone: "text-[#e11d48]" },
  tiktok: { label: "TikTok", badge: "TT", tone: "text-[#111827]" },
  x: { label: "X", badge: "X", tone: "text-[#111827]" },
  twitch: { label: "Twitch", badge: "TW", tone: "text-[#6441a5]" },
  pinterest: { label: "Pinterest", badge: "P", tone: "text-[#bd081c]" },
  blog: { label: "Blog", badge: "WP", tone: "text-[#69716b]" },
}

const platformAliases: Record<string, ConnectedPlatform> = {
  instagram: "instagram",
  ig: "instagram",
  youtube: "youtube",
  yt: "youtube",
  tiktok: "tiktok",
  tik_tok: "tiktok",
  x: "x",
  twitter: "x",
  twitch: "twitch",
  pinterest: "pinterest",
  blog: "blog",
}

function getCreatorPlatforms(creator: Creator): ConnectedPlatform[] {
  const platforms = (creator.platforms ?? [])
    .map((platform) => platformAliases[platform.toLowerCase()])
    .filter((platform): platform is ConnectedPlatform => Boolean(platform))

  return platforms.length > 0 ? Array.from(new Set(platforms)) : []
}

const NOT_AVAILABLE = "Not available"

/** Real provider metrics only.
 *
 * This previously synthesised every value except Followers from
 * `seed = creator.handle.length + platform.length` - e.g. `views = seed * 9`,
 * `engagement = (seed % 8) + 2.1`. Those were invented numbers attached to a named real person's
 * profile, under a "public data" label. Now: show what the provider actually returned, and say
 * "Not available" for what it didn't. Avg. likes/shares/comments are dropped entirely - TikHub
 * exposes no such aggregate, so there is no honest value to show.
 *
 * Everything here is currently null for TikHub except Followers, because its posts endpoints are
 * paywalled/broken (see the module notes). That's the true state of the data.
 */
function platformMetrics(creator: Creator) {
  return [
    { label: "Followers", value: creator.followers || NOT_AVAILABLE },
    {
      label: "Avg. engagement rate",
      value: creator.engagementRate != null ? `${creator.engagementRate}%` : NOT_AVAILABLE,
    },
    {
      label: "Avg. views",
      value:
        creator.recentPostAvgViews != null
          ? creator.recentPostAvgViews.toLocaleString("en-US")
          : NOT_AVAILABLE,
    },
  ]
}

function CreatorProfileModal({ creator, onClose, onContact }: { creator: Creator; onClose: () => void; onContact: () => void }) {
  const connectedPlatforms = getCreatorPlatforms(creator)
  const profilePlatforms = connectedPlatforms.length > 0 ? connectedPlatforms : (["instagram"] as ConnectedPlatform[])
  const [activePlatform, setActivePlatform] = useState<ConnectedPlatform>(profilePlatforms[0])
  const metrics = platformMetrics(creator)
  const samples = creatorWorkSamples.slice(0, 3)
  useEscapeKey(true, onClose)

  return (
    <div className="fixed inset-0 z-50 bg-[#1f252b]/35 p-3 backdrop-blur-sm" onClick={onClose}>
      <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-[12px] border border-[#e8e2d9] bg-[#fbfaf7] shadow-[0_24px_80px_rgba(31,37,43,0.2)]" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#e8e2d9] px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <CreatorAvatar creator={creator} className="size-11 shrink-0 rounded-[8px] text-xs" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-base font-black tracking-tight text-[#1f252b]">{creator.name}</h2>
                {creator.country && (
                  <span className="rounded-full bg-[#f0ece5] px-2 py-0.5 text-[10px] font-black text-[#69716b]">{creator.country}</span>
                )}
              </div>
              <p className="mt-1 text-xs font-black text-[#8a8175]">{creator.handle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="inline-flex h-9 items-center gap-2 rounded-[8px] bg-[#1f252b] px-3 text-xs font-black text-white" type="button" onClick={onContact}>
              <Send className="size-3.5" aria-hidden="true" />
              Contact
            </button>
            <button className="grid size-9 place-items-center rounded-full border border-[#ded8cf] bg-white text-[#69716b]" type="button" aria-label="Close profile" onClick={onClose}>
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="border-b border-[#e8e2d9] px-4 py-2">
          <div className="flex flex-wrap gap-2">
            {profilePlatforms.map((platform) => (
              <button
                key={platform}
                className={`inline-flex h-8 items-center gap-2 rounded-full px-3 text-xs font-black transition ${
                  activePlatform === platform ? "bg-[#1f252b] text-white" : "bg-white text-[#69716b] hover:bg-[#f2eee8]"
                }`}
                type="button"
                onClick={() => setActivePlatform(platform)}
              >
                <span className={`grid size-5 place-items-center rounded-full bg-white text-[9px] ring-1 ring-[#e8e2d9] ${platformLabels[platform].tone}`}>
                  {platformLabels[platform].badge}
                </span>
                {platformLabels[platform].label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[1fr_320px]">
          <main className="min-w-0 p-4">
            <div className="mb-4 grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
              {metrics.map((metric) => (
                <div key={metric.label} className="rounded-[8px] border border-[#e8e2d9] bg-white p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8a8175]">{metric.label}</p>
                  <p className="mt-1 text-base font-black text-[#1f252b]">{metric.value}</p>
                </div>
              ))}
            </div>

            {/* A "Compare to similar creators" panel, a "Post per day" heatmap, an engagement
                chart and a "publication time" grid used to sit here. Every one was fabricated:
                the comparison hardcoded an "F" grade and "bottom 10%" for EVERY creator, the
                heatmap/grid were seeded off `creator.handle.length` / `creator.name.length`, and
                the chart was a fixed SVG polyline. Presenting invented analytics about a named
                real person - and grading them "F" - is not a placeholder, it's a false statement
                about someone. Removed, not restyled. Re-add only when backed by a real source
                (verified OAuth analytics, per the plan's verified plane). */}
            <section className="rounded-[8px] border border-dashed border-[#ded8cf] bg-white p-5 text-center">
              <p className="text-sm font-black text-[#1f252b]">Detailed analytics aren&apos;t available yet</p>
              <p className="mx-auto mt-2 max-w-lg text-xs font-semibold leading-5 text-[#69716b]">
                {creator.isOnboarded === false
                  ? "Public data only shows the follower count above. Engagement, views and audience breakdowns need this creator to join Nepfluence and connect their account."
                  : "This creator hasn't connected a social account yet, so there are no verified metrics to show."}
              </p>
            </section>

            <section className="mt-4">
              <h3 className="mb-3 text-sm font-black text-[#1f252b]">{platformLabels[activePlatform].label} content</h3>
              <div className="grid gap-3 md:grid-cols-3">
                {samples.map((sample, index) => (
                  <article key={`${activePlatform}-${sample.title}`} className="overflow-hidden rounded-[8px] border border-[#e8e2d9] bg-white">
                    <div className="h-40 bg-[#eee8df] bg-cover bg-center" style={{ backgroundImage: `url(${sample.image})` }} />
                    <div className="p-3">
                      <p className="text-xs font-black text-[#1f252b]">{index === 0 ? metrics[1].value : sample.metric} engagement</p>
                      <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-[#69716b]">{sample.title} for {creator.niche.toLowerCase()} campaigns.</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </main>

          <aside className="border-t border-[#e8e2d9] bg-[#f5f1ea] p-4 lg:border-l lg:border-t-0">
            <h3 className="text-sm font-black text-[#1f252b]">Channel overview</h3>
            <div className="mt-3 rounded-[8px] border border-[#e8e2d9] bg-white p-4">
              <div className="flex items-center gap-3">
                <span className={`grid size-10 place-items-center rounded-[8px] bg-[#f0ece5] text-sm font-black ${platformLabels[activePlatform].tone}`}>{platformLabels[activePlatform].badge}</span>
                <div>
                  <p className="text-sm font-black text-[#1f252b]">{creator.handle.replace("@", "")}</p>
                  <p className="text-xs font-semibold text-[#69716b]">{platformLabels[activePlatform].label}</p>
                </div>
              </div>
              {/* "Effectiveness: Good fit", "Posting cadence: 3-5 weekly" and "Brand safety:
                  Clear" were hardcoded here - identical for every creator. "Brand safety: Clear"
                  is the most dangerous fabrication in this file: it asserts that an unvetted,
                  scraped account is safe to hand money to. We run no brand-safety check of any
                  kind. Removed. Only re-add with a real signal behind it. */}
              <div className="mt-4 grid gap-3 text-xs font-semibold text-[#69716b]">
                <div className="flex justify-between">
                  <span>Followers</span>
                  <b className="text-[#1f252b]">{creator.followers || "Not available"}</b>
                </div>
                {creator.statsAsOf && (
                  <div className="flex justify-between">
                    <span>Data as of</span>
                    <b className="text-[#1f252b]">{new Date(creator.statsAsOf).toLocaleDateString()}</b>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Source</span>
                  <b className="text-[#1f252b]">
                    {creator.isOnboarded === false ? "Public data (unverified)" : "Nepfluence profile"}
                  </b>
                </div>
              </div>
            </div>

            <h3 className="mt-5 text-sm font-black text-[#1f252b]">Connected channels</h3>
            <div className="mt-3 grid gap-2">
              {profilePlatforms.map((platform) => (
                <button key={platform} className="flex items-center justify-between rounded-[8px] border border-[#e8e2d9] bg-white px-3 py-2 text-left text-xs font-black text-[#505852]" type="button" onClick={() => setActivePlatform(platform)}>
                  <span className="inline-flex items-center gap-2">
                    <span className={`grid size-6 place-items-center rounded-full bg-[#f0ece5] text-[10px] ${platformLabels[platform].tone}`}>{platformLabels[platform].badge}</span>
                    {platformLabels[platform].label}
                  </span>
                  <span className="text-[#8a8175]">{platform === activePlatform ? "Viewing" : "Open"}</span>
                </button>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function ModalTab({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button className={`h-14 border-b-2 px-3 text-sm font-bold ${active ? "border-[#1f252b] text-[#1f252b]" : "border-transparent text-[#69716b]"}`} type="button" onClick={onClick}>
      {label}
    </button>
  )
}

function AnalyticsCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[20px] border border-[#e8e2d9] bg-white p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8a8175]">{label}</p>
      <p className="mt-2 text-2xl font-black text-[#1f252b]">{value}</p>
      <p className="mt-1 text-xs font-semibold text-[#69716b]">{detail}</p>
    </div>
  )
}

function AnalyticsBreakdown({ title, items }: { title: string; items: { label: string; value: string }[] }) {
  return (
    <div className="rounded-[20px] border border-[#e8e2d9] bg-white p-4">
      <h3 className="text-sm font-black text-[#1f252b]">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between text-xs font-black text-[#505852]">
              <span>{item.label}</span>
              <span>{item.value}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#f0ece5]">
              <div className="h-full rounded-full bg-[#1f252b]" style={{ width: item.value }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
