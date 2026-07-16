"use client"

import { ClipboardList, Megaphone, ShieldCheck, UsersRound } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { FormEvent, useEffect, useMemo, useRef, useState } from "react"
import { apiClient } from "@/lib/api-client"
import { searchDiscoveryCreators, type DiscoveryCreator, type DiscoveryPlatform } from "@/features/campaigns/api/discoveryApi"
import {
  type Message,
  hideConversation as hideConversationApi,
  hideMessage as hideMessageApi,
  listConversations,
  listMessages as listMessagesApi,
  openConversation as openConversationApi,
  sendMessage as sendMessageApi,
} from "@/features/conversations/api/conversationApi"
import type { BrandConversation } from "./panels/MessagesPanel"
import {
  MarketplaceApplication as Application,
  MarketplaceCampaign as Campaign,
  MarketplaceCollaboration as Collaboration,
  MarketplaceLedgerEntry as LedgerEntry,
  MarketplaceWallet as Wallet,
  ApplicationStatus,
  CreatorDiscoveryDecision,
  useMarketplaceStore,
} from "@/features/shared/marketplaceStore"
import {
  type Collaboration as RealCollaboration,
  type LedgerEntry as RealLedgerEntry,
  type Wallet as RealWallet,
  approveDeliverable as approveDeliverableApi,
  depositEscrow as depositEscrowApi,
  getLedger,
  getWallet,
  listMyCollaborations,
} from "@/features/collaborations/api/collaborationApi"
import {
  type Campaign as RealCampaign,
  closeCampaign as closeCampaignApi,
  completeCampaign as completeCampaignApi,
  createCampaign as createCampaignApi,
  listMyCampaigns,
  publishCampaign as publishCampaignApi,
  updateCampaign as updateCampaignApi,
  uploadCampaignPicture,
} from "@/features/campaigns/api/campaignApi"
import {
  type Proposal,
  acceptProposal as acceptProposalApi,
  listCampaignProposals,
  rejectProposal as rejectProposalApi,
} from "@/features/campaigns/api/proposalApi"
import { readMockSession } from "@/lib/auth"
import {
  ApplicationQueue,
  BrandProfilePanel,
  CampaignList,
  CollaborationsPanel,
  DiscoverPanel,
  MessagesPanel,
  NotificationPanel,
  PaymentsPanel,
  TrustPanel,
} from "./BrandDashboardPanels"
import { CampaignFormModal, CampaignManageModal, LifecycleModal, SupportPanel } from "./BrandDashboardModals"
import { BrandDashboardHome } from "./BrandDashboardHome"
import { BrandDashboardShell } from "./BrandDashboardShell"
import { type Activity, type Creator, type Section, emptyCampaignForm, navItems } from "./brand-dashboard.shared"

const startSectionKey = "nepfluence-brand-start-section"
const brandSectionKey = "nepfluence-brand-active-section"

const brandSectionPaths: Record<Section, string> = {
  Dashboard: "/dashboard",
  Campaigns: "/campaigns",
  Applications: "/applications",
  Collaborations: "/collaborations",
  Messages: "/messages",
  "Discover Creators": "/discover-creators",
  Payments: "/payments",
  "Brand Profile": "/brand-profile",
  "Trust & Reports": "/trust-reports",
}

const brandPathSections = Object.fromEntries(
  Object.entries(brandSectionPaths).map(([section, path]) => [path, section as Section]),
) as Record<string, Section>

type CreatorDirectoryProfile = {
  id: number
  user_id: number
  full_name: string
  handle: string
  country: "NP" | "IN"
  niche: string
  followers: string
  rating: string
  image?: string | null
  platforms?: string[]
}

// A `creatorImages` array of stock Unsplash portraits used to live here, assigned by
// `index % 5` to any creator without a photo. That put unrelated strangers' faces on named real
// people's cards. Removed: a missing photo now renders initials (see CreatorAvatar in
// DiscoverPanel). Never substitute a human face you can't attribute to the actual account.
function directoryProfileToCreator(profile: CreatorDirectoryProfile): Creator {
  return {
    name: profile.full_name,
    handle: profile.handle,
    country: profile.country,
    niche: profile.niche,
    followers: profile.followers || "0",
    rating: profile.rating || "New",
    // "kei xaina" is a placeholder string sitting in the demo DB's image_path column.
    image: profile.image && profile.image !== "kei xaina" ? profile.image : null,
    platforms: profile.platforms ?? [],
    isOnboarded: true,
  }
}

// Track 1: creators found via TikHub/YouTube search who haven't signed up to Nepfluence.
// country is null, NOT "NP": TikHub returns no reliable country signal, and this badge is shown
// to brands choosing who to pay - a live search for "Nihvo" returned a Serbian restaurant and a
// Brazilian vet clinic, which a hardcoded "NP" would have presented as Nepali. Unknown-country
// creators are consequently excluded by the NP/IN filter (we can't show they match it).
function discoveryProfileToCreator(profile: DiscoveryCreator): Creator {
  const handle = profile.handle.startsWith("@") ? profile.handle : `@${profile.handle}`
  return {
    name: profile.display_name || profile.handle,
    handle,
    country: null,
    niche: "Uncategorized",
    // "0" only if the provider genuinely reported 0; null follower counts render as "—".
    followers: profile.followers != null ? profile.followers.toLocaleString("en-US") : "",
    rating: "Discovered",
    // The REAL avatar from the platform, or null -> initials. Never a stock photo: previously
    // this used creatorImages[index % 5], which put unrelated strangers' faces on named real
    // creators (a woman's stock photo on MrBeast's card).
    image: profile.avatar_url,
    engagementRate: profile.avg_engagement_rate,
    recentPostAvgViews: profile.recent_post_avg_views,
    platforms: [profile.platform],
    isOnboarded: false,
    statsAsOf: profile.last_scraped_at,
  }
}

function titleFromEmail(email?: string) {
  const base = email?.split("@")[0] || "Brand"
  return base
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function deliverableCopy(state: Collaboration["state"], escrow: Collaboration["escrow"]) {
  if (state === "APPROVED") return "Approved. Payout released to creator wallet."
  if (state === "SUBMITTED") return "Video deliverable submitted. Waiting for brand review."
  if (escrow === "HELD") return "Chat unlocked. Waiting for first deliverable."
  return "Escrow required before chat unlocks."
}

function toUiCollaboration(collab: RealCollaboration, brandUserId: string | undefined, fallbackBrandName: string): Collaboration {
  const state = collab.state.toUpperCase() as Collaboration["state"]
  const escrow = collab.escrow_status.toUpperCase() as Collaboration["escrow"]

  return {
    id: collab.id,
    brandUserId,
    creatorUserId: collab.creator ? String(collab.creator.user_id) : undefined,
    creatorHandle: collab.creator?.handle,
    campaign: collab.campaign?.title ?? "Campaign",
    campaignId: collab.campaign?.id ?? 0,
    brand: collab.campaign?.brand_name ?? fallbackBrandName,
    creator: collab.creator?.full_name ?? "Creator",
    state,
    escrow,
    deliverable: deliverableCopy(state, escrow),
    payout: collab.payout_amount,
    submission: collab.submission
      ? {
          videoUrl: collab.submission.video_url,
          postUrl: collab.submission.post_url ?? "",
          caption: collab.submission.caption ?? "",
          notes: collab.submission.notes ?? "",
          aspectRatio: collab.submission.aspect_ratio ?? "",
          duration: collab.submission.duration ?? "",
          submittedAt: collab.submission.submitted_at,
          checklist: {
            briefMatched: collab.submission.brief_matched,
            usageRights: collab.submission.usage_rights,
            noCopyrightMusic: collab.submission.no_copyright_music,
          },
        }
      : undefined,
  }
}

function toUiWallet(wallet: RealWallet | null, userId: string | undefined, role: Wallet["role"]): Wallet | null {
  if (!wallet) return null
  return { userId: userId ?? "", role, balance: wallet.balance, escrowHeld: wallet.escrow_held, released: wallet.released }
}

function toUiLedger(entries: RealLedgerEntry[]): LedgerEntry[] {
  return entries.map((entry) => ({
    id: entry.id,
    collaborationId: entry.collaboration_id,
    fromUserId: entry.from_user_id !== null ? String(entry.from_user_id) : undefined,
    toUserId: entry.to_user_id !== null ? String(entry.to_user_id) : undefined,
    type: entry.type === "escrow_deposit" ? "ESCROW_DEPOSIT" : "PAYOUT_RELEASE",
    amount: entry.amount,
    createdAt: entry.created_at,
  }))
}

function readBrandSection(): Section {
  if (typeof window === "undefined") return "Discover Creators"

  const pathSection = brandPathSections[window.location.pathname]
  if (pathSection) return pathSection

  const startSection = window.localStorage.getItem(startSectionKey) as Section | null
  if (startSection && navItems.some((item) => item.label === startSection)) {
    window.localStorage.removeItem(startSectionKey)
    return startSection
  }

  const storedSection = window.localStorage.getItem(brandSectionKey) as Section | null
  return storedSection && navItems.some((item) => item.label === storedSection) ? storedSection : "Discover Creators"
}

export default function BrandDashboardOverview() {
  const pathname = usePathname()
  const router = useRouter()
  const marketplace = useMarketplaceStore()
  const session = readMockSession()
  const currentBrandName = session?.username || titleFromEmail(session?.email)
  const [activeSection, setActiveSection] = useState<Section>(() => readBrandSection())
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [campaignModalOpen, setCampaignModalOpen] = useState(false)
  const [managedCampaignId, setManagedCampaignId] = useState<number | null>(null)
  const [lifecycleOpen, setLifecycleOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [creatorFilter, setCreatorFilter] = useState<"ALL" | "NP" | "IN">("ALL")
  const [creatorSearch, setCreatorSearch] = useState("")
  const [directoryCreators, setDirectoryCreators] = useState<Creator[]>([])
  const [discoveredCreators, setDiscoveredCreators] = useState<Creator[]>([])
  const [brandMessage, setBrandMessage] = useState("")
  const [conversations, setConversations] = useState<BrandConversation[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null)
  const [conversationMessages, setConversationMessages] = useState<Message[]>([])
  const [conversationsReloadToken, setConversationsReloadToken] = useState(0)
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null)
  const [form, setForm] = useState(emptyCampaignForm)
  const [pendingCampaignFile, setPendingCampaignFile] = useState<File | null>(null)
  const [realCampaigns, setRealCampaigns] = useState<RealCampaign[]>([])
  const [realProposals, setRealProposals] = useState<Proposal[]>([])
  const [campaignsReloadToken, setCampaignsReloadToken] = useState(0)
  const currentSection = brandPathSections[pathname] ?? activeSection

  function refreshCampaignsAndProposals() {
    setCampaignsReloadToken((token) => token + 1)
  }

  useEffect(() => {
    let cancelled = false

    async function loadCampaignsAndProposals() {
      try {
        const myCampaigns = await listMyCampaigns()
        const proposalLists = await Promise.all(
          myCampaigns.map((campaign) => listCampaignProposals(campaign.id).catch(() => [] as Proposal[])),
        )
        if (!cancelled) {
          setRealCampaigns(myCampaigns)
          setRealProposals(proposalLists.flat())
        }
      } catch {
        if (!cancelled) {
          setRealCampaigns([])
          setRealProposals([])
        }
      }
    }

    void loadCampaignsAndProposals()

    return () => {
      cancelled = true
    }
  }, [campaignsReloadToken])

  const campaigns = useMemo<Campaign[]>(
    () =>
      realCampaigns.map((campaign) => {
        const campaignProposals = realProposals.filter((proposal) => proposal.campaign_id === campaign.id)
        return {
          id: campaign.id,
          brandUserId: session?.userId,
          brand: currentBrandName,
          title: campaign.title,
          niche: campaign.niche ?? "",
          budget: campaign.budget_max,
          country: (campaign.country ?? "NP") as "NP" | "IN",
          platform: campaign.platform ?? "",
          status: campaign.status.toUpperCase() as Campaign["status"],
          applications: campaignProposals.filter((proposal) => proposal.status !== "withdrawn").length,
          accepted: campaignProposals.filter((proposal) => proposal.status === "accepted").length,
          reach: 0,
          deadline: campaign.deadline ?? "Not set",
          brief: campaign.description ?? "",
        }
      }),
    [realCampaigns, realProposals, session?.userId, currentBrandName],
  )
  const applications = useMemo<Application[]>(
    () =>
      realProposals
        .filter((proposal) => proposal.status !== "withdrawn")
        .map((proposal) => ({
          id: proposal.id,
          creatorUserId: proposal.creator ? String(proposal.creator.user_id) : undefined,
          creator: proposal.creator?.full_name ?? "Creator",
          handle: proposal.creator?.handle ?? "",
          country: (proposal.creator?.country ?? "NP") as "NP" | "IN",
          niche: proposal.creator?.niche ?? "",
          followers: proposal.creator?.followers ?? "0",
          match: 90,
          status: proposal.status.toUpperCase() as ApplicationStatus,
          campaignId: proposal.campaign_id,
        })),
    [realProposals],
  )

  function refreshConversations() {
    setConversationsReloadToken((token) => token + 1)
  }

  useEffect(() => {
    let cancelled = false

    async function loadConversations() {
      if (campaigns.length === 0) {
        if (!cancelled) setConversations([])
        return
      }
      try {
        const lists = await Promise.all(
          campaigns.map((campaign) =>
            listConversations(campaign.id)
              .then((items) => items.map((item) => ({ ...item, campaignTitle: campaign.title })))
              .catch(() => [] as BrandConversation[]),
          ),
        )
        if (!cancelled) setConversations(lists.flat())
      } catch {
        if (!cancelled) setConversations([])
      }
    }

    void loadConversations()
    const intervalId = window.setInterval(() => {
      void loadConversations()
    }, 5000)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaigns.map((campaign) => campaign.id).join(","), conversationsReloadToken])

  const activeConversationId = conversations.some((item) => item.id === selectedConversationId)
    ? selectedConversationId
    : (conversations[0]?.id ?? null)

  useEffect(() => {
    let cancelled = false

    async function loadMessages() {
      const conversation = conversations.find((item) => item.id === activeConversationId)
      if (!conversation) {
        if (!cancelled) setConversationMessages([])
        return
      }
      try {
        const items = await listMessagesApi(conversation.campaign_id, conversation.id)
        if (!cancelled) setConversationMessages(items)
      } catch {
        if (!cancelled) setConversationMessages([])
      }
    }

    void loadMessages()

    return () => {
      cancelled = true
    }
  }, [conversations, activeConversationId])

  const [depositErrors, setDepositErrors] = useState<Record<number, string>>({})
  const [realCollaborations, setRealCollaborations] = useState<RealCollaboration[]>([])
  const [realWallet, setRealWallet] = useState<RealWallet | null>(null)
  const [realLedger, setRealLedger] = useState<RealLedgerEntry[]>([])
  const [collaborationsReloadToken, setCollaborationsReloadToken] = useState(0)

  function refreshCollaborations() {
    setCollaborationsReloadToken((token) => token + 1)
  }

  useEffect(() => {
    let cancelled = false

    async function loadCollaborations() {
      const [collabs, wallet, ledger] = await Promise.all([
        listMyCollaborations().catch(() => [] as RealCollaboration[]),
        getWallet().catch(() => null),
        getLedger().catch(() => [] as RealLedgerEntry[]),
      ])
      if (!cancelled) {
        setRealCollaborations(collabs)
        setRealWallet(wallet)
        setRealLedger(ledger)
      }
    }

    void loadCollaborations()

    return () => {
      cancelled = true
    }
  }, [collaborationsReloadToken])

  const collaborations = useMemo(
    () => realCollaborations.map((collab) => toUiCollaboration(collab, session?.userId, currentBrandName)),
    [realCollaborations, session?.userId, currentBrandName],
  )
  const brandWallet = useMemo(() => toUiWallet(realWallet, session?.userId, "brand"), [realWallet, session?.userId])
  const brandLedger = useMemo(() => toUiLedger(realLedger), [realLedger])
  const [activities, setActivities] = useState<Activity[]>([])

  useEffect(() => {
    window.localStorage.setItem(brandSectionKey, currentSection)
  }, [currentSection])

  useEffect(() => {
    let cancelled = false

    async function loadCreatorDirectory() {
      try {
        const profiles = await apiClient<CreatorDirectoryProfile[]>("/influencer-profile/directory")
        if (!cancelled) {
          const nextCreators = profiles.map(directoryProfileToCreator)
          setDirectoryCreators(nextCreators)
          setSelectedCreator((current) => current ?? nextCreators[0] ?? null)
        }
      } catch {
        if (!cancelled) {
          setDirectoryCreators([])
          setSelectedCreator(null)
        }
      }
    }

    void loadCreatorDirectory()

    return () => {
      cancelled = true
    }
  }, [])

  // Track 1: debounced search-triggered discovery ingestion. A brand's search text drives a
  // live TikHub/YouTube lookup for creators who haven't signed up - deliberately NOT fired on
  // every keystroke or on a bare page load (plan §7 cost discipline: only a real search
  // triggers a possible billed provider call, and the backend's own cache-through logic
  // absorbs repeats within the TTL).
  useEffect(() => {
    const query = creatorSearch.trim()
    if (query.length < 2) {
      setDiscoveredCreators([])
      return
    }

    let cancelled = false
    const timer = setTimeout(async () => {
      const platforms: DiscoveryPlatform[] = ["instagram", "tiktok"]
      const results = await Promise.all(
        platforms.map((platform) =>
          searchDiscoveryCreators({ platform, query, limit: 8 }).catch(() => [] as DiscoveryCreator[]),
        ),
      )
      if (!cancelled) {
        setDiscoveredCreators(results.flat().map(discoveryProfileToCreator))
      }
    }, 500)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [creatorSearch])

  // Merge onboarded (real) creators with scraped/not-yet-onboarded ones found via search,
  // following the multi-source-adapter pattern this component already uses elsewhere
  // (campaigns/proposals/collaborations). Onboarded creators win on handle collisions.
  const combinedCreators = useMemo(() => {
    const knownHandles = new Set(directoryCreators.map((creator) => creator.handle.toLowerCase()))
    const uniqueDiscovered = discoveredCreators.filter(
      (creator) => !knownHandles.has(creator.handle.toLowerCase()),
    )
    return [...directoryCreators, ...uniqueDiscovered]
  }, [directoryCreators, discoveredCreators])


  const idCounter = useRef(0)

  function nextUiId() {
    idCounter.current += 1
    return Date.now() * 1000 + idCounter.current
  }

  const analytics = useMemo(() => {
    const liveCampaigns = campaigns.filter((campaign) => campaign.status === "PUBLISHED").length
    const pendingApplicationsCount = applications.filter((application) => application.status === "PENDING").length
    const escrowHeld = collaborations.filter((collab) => collab.escrow === "HELD").length
    const reach = campaigns.reduce((sum, campaign) => sum + campaign.reach, 0)

    return [
      { label: "Live campaigns", value: liveCampaigns.toString(), detail: "Published and visible", icon: Megaphone },
      { label: "Pending applications", value: pendingApplicationsCount.toString(), detail: "Awaiting your review", icon: ClipboardList },
      { label: "Escrow held", value: escrowHeld.toString(), detail: "Chat unlocked", icon: ShieldCheck },
      { label: "Tracked reach", value: reach > 0 ? `${Math.round(reach / 1000)}K` : "0", detail: "MVP campaign estimate", icon: UsersRound },
    ]
  }, [campaigns, applications, collaborations])

  const filteredCreators = (creatorFilter === "ALL" ? combinedCreators : combinedCreators.filter((creator) => creator.country === creatorFilter)).filter((creator) => {
    const query = creatorSearch.trim().toLowerCase()
    if (!query) return true

    // country is nullable (unknown for discovery creators) - filter out nullish before
    // .toLowerCase(), which would otherwise throw and take down the whole panel exactly when
    // a search is active (i.e. precisely when discovery creators are present).
    return [creator.name, creator.handle, creator.niche, creator.country]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLowerCase().includes(query))
  })
  const pendingApplications = applications.filter((application) => application.status === "PENDING")
  const managedCampaign = campaigns.find((campaign) => campaign.id === managedCampaignId) ?? null
  const paymentTotal = collaborations.filter((collab) => collab.escrow === "HELD").reduce((sum, collab) => sum + collab.payout, 0)

  function addActivity(message: string, tone: Activity["tone"] = "blue") {
    setActivities((current) => [{ id: nextUiId(), message, tone }, ...current].slice(0, 6))
  }

  function submitCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = form.title.trim() || "Untitled campaign"
    const budget = Number(form.budget) || 0
    const fileToUpload = pendingCampaignFile

    void (async () => {
      try {
        const created = await createCampaignApi({
          title,
          description: form.brief.trim() || undefined,
          budget_min: budget,
          budget_max: budget,
          niche: form.niche || undefined,
          country: (form.country || undefined) as "NP" | "IN" | undefined,
          platform: form.platform || undefined,
          deadline: form.deadline || undefined,
        })

        setRealCampaigns((current) => [created, ...current])

        if (fileToUpload) {
          const updated = await uploadCampaignPicture(created.id, fileToUpload).catch(() => undefined)
          if (updated) {
            setRealCampaigns((current) => current.map((campaign) => (campaign.id === updated.id ? updated : campaign)))
          }
        }

        setForm(emptyCampaignForm)
        setPendingCampaignFile(null)
        setCampaignModalOpen(false)
        await refreshCampaignsAndProposals()
        goTo("Campaigns")
        addActivity(`${title} created as DRAFT.`, "blue")
      } catch (error) {
        addActivity(error instanceof Error ? error.message : "Could not create campaign.", "red")
      }
    })()
  }

  function publishCampaign(id: number) {
    void (async () => {
      try {
        await publishCampaignApi(id)
        await refreshCampaignsAndProposals()
        addActivity("Campaign published and visible to influencers.", "green")
      } catch (error) {
        addActivity(error instanceof Error ? error.message : "Could not publish campaign.", "red")
      }
    })()
  }

  function updateCampaign(id: number, updates: Partial<Pick<Campaign, "status" | "budget" | "deadline">>) {
    void (async () => {
      try {
        if (updates.budget !== undefined || updates.deadline !== undefined) {
          await updateCampaignApi(id, {
            ...(updates.budget !== undefined ? { budget_min: updates.budget, budget_max: updates.budget } : {}),
            ...(updates.deadline !== undefined
              ? { deadline: updates.deadline === "Not set" ? undefined : updates.deadline }
              : {}),
          })
        }
        if (updates.status === "PUBLISHED") await publishCampaignApi(id)
        else if (updates.status === "CLOSED") await closeCampaignApi(id)
        else if (updates.status === "COMPLETED") await completeCampaignApi(id)

        await refreshCampaignsAndProposals()
        addActivity("Campaign settings updated.", "green")
      } catch (error) {
        addActivity(error instanceof Error ? error.message : "Could not update campaign.", "red")
      }
    })()
  }

  function openCampaignManager(campaign: Campaign) {
    setManagedCampaignId(campaign.id)
    addActivity(`${campaign.title} opened in campaign manager.`, "blue")
  }

  function reviewApplication(id: number, status: ApplicationStatus) {
    const application = applications.find((item) => item.id === id)

    void (async () => {
      try {
        if (status === "ACCEPTED") {
          await acceptProposalApi(id)
        } else {
          await rejectProposalApi(id)
        }
        await refreshCampaignsAndProposals()

        if (status === "ACCEPTED") {
          addActivity(`${application?.creator ?? "Creator"} accepted. You can now message them.`, "amber")
          goTo("Messages")
        } else {
          addActivity(`${application?.creator ?? "Creator"} rejected and notified.`, "red")
        }
      } catch (error) {
        addActivity(error instanceof Error ? error.message : "Could not update application.", "red")
      }
    })()
  }

  function decideCreatorDiscovery(creator: Creator, status: CreatorDiscoveryDecision["status"]) {
    marketplace.decideCreatorDiscovery({ creator: creator.name, handle: creator.handle }, status)
    addActivity(`${creator.name} ${status === "SELECTED" ? "moved to selected creators" : "moved to rejected creators"}.`, status === "SELECTED" ? "blue" : "red")
  }

  function depositEscrow(id: number) {
    setDepositErrors((current) => {
      if (!(id in current)) return current
      const { [id]: _removed, ...rest } = current
      return rest
    })

    void (async () => {
      try {
        await depositEscrowApi(id)
        refreshCollaborations()
        addActivity("Escrow deposited. Collaboration chat is unlocked.", "green")
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not deposit escrow."
        addActivity(message, "red")
        setDepositErrors((current) => ({ ...current, [id]: message }))
      }
    })()
  }

  function approveDeliverable(id: number) {
    void (async () => {
      try {
        await approveDeliverableApi(id)
        refreshCollaborations()
        addActivity("Deliverable approved. Payment released.", "green")
      } catch (error) {
        addActivity(error instanceof Error ? error.message : "Could not approve deliverable.", "red")
      }
    })()
  }

  function messageCreatorAboutApplication(applicationId: number) {
    const proposal = realProposals.find((item) => item.id === applicationId)
    if (!proposal || proposal.status !== "accepted") return

    void (async () => {
      try {
        const conversation = await openConversationApi(proposal.campaign_id, proposal.influencer_profile_id)
        refreshConversations()
        setSelectedConversationId(conversation.id)
        goTo("Messages")
      } catch (error) {
        addActivity(error instanceof Error ? error.message : "Could not open conversation.", "red")
      }
    })()
  }

  function messageCreatorAboutCollaboration(collabId: number) {
    const collab = realCollaborations.find((item) => item.id === collabId)
    if (!collab?.campaign || !collab.creator) return

    void (async () => {
      try {
        const conversation = await openConversationApi(collab.campaign!.id, collab.creator!.id)
        refreshConversations()
        setSelectedConversationId(conversation.id)
        goTo("Messages")
      } catch (error) {
        addActivity(error instanceof Error ? error.message : "Could not open conversation.", "red")
      }
    })()
  }

  function goTo(section: Section) {
    setActiveSection(section)
    const path = brandSectionPaths[section]
    if (path && path !== pathname) router.push(path)
    setMobileMenuOpen(false)
  }

  function viewManagedCampaignApplications() {
    setManagedCampaignId(null)
    goTo("Applications")
  }

  function viewManagedCampaignCollaborations() {
    setManagedCampaignId(null)
    goTo("Collaborations")
  }

  function sendBrandMessage() {
    const body = brandMessage.trim()
    if (!body) return

    const conversation = conversations.find((item) => item.id === activeConversationId)
    if (!conversation) return

    void (async () => {
      try {
        await sendMessageApi(conversation.campaign_id, conversation.id, body)
        setBrandMessage("")
        refreshConversations()
        addActivity(`Message sent to ${conversation.creator.full_name}.`, "blue")
      } catch (error) {
        addActivity(error instanceof Error ? error.message : "Could not send message.", "red")
      }
    })()
  }

  function deleteBrandConversation(conversationId: number) {
    const conversation = conversations.find((item) => item.id === conversationId)
    if (!conversation) return

    void (async () => {
      try {
        await hideConversationApi(conversation.campaign_id, conversation.id)
        refreshConversations()
        addActivity(`Conversation with ${conversation.creator.full_name} hidden.`, "amber")
      } catch (error) {
        addActivity(error instanceof Error ? error.message : "Could not hide conversation.", "red")
      }
    })()
  }

  function deleteBrandMessages(messageIds: number[]) {
    if (!messageIds.length) return
    const conversation = conversations.find((item) => item.id === activeConversationId)
    if (!conversation) return

    void (async () => {
      try {
        await Promise.all(messageIds.map((messageId) => hideMessageApi(conversation.campaign_id, conversation.id, messageId)))
        setConversationMessages((current) => current.filter((item) => !messageIds.includes(item.id)))
        addActivity(`${messageIds.length} message${messageIds.length === 1 ? "" : "s"} permanently deleted.`, "amber")
      } catch (error) {
        addActivity(error instanceof Error ? error.message : "Could not delete messages.", "red")
      }
    })()
  }

  return (
    <BrandDashboardShell
      activeSection={currentSection}
      mobileMenuOpen={mobileMenuOpen}
      onCloseMobileMenu={() => setMobileMenuOpen(false)}
      onNavigate={goTo}
      onOpenCampaign={() => setCampaignModalOpen(true)}
      onOpenLifecycle={() => setLifecycleOpen(true)}
      onOpenMobileMenu={() => setMobileMenuOpen(true)}
      onOpenNotifications={() => setNotificationOpen((open) => !open)}
      onOpenSupport={() => setChatOpen(true)}
    >
      {currentSection === "Dashboard" && (
        <BrandDashboardHome
          activities={activities}
          analytics={analytics}
          campaigns={campaigns}
          pendingApplications={pendingApplications}
          onCreateCampaign={() => setCampaignModalOpen(true)}
          onDiscoverCreators={() => goTo("Discover Creators")}
          onManageCampaign={openCampaignManager}
          onPublishCampaign={publishCampaign}
          onReviewApplication={reviewApplication}
        />
      )}

      {currentSection === "Campaigns" && (
        <CampaignList campaigns={campaigns} onPublish={publishCampaign} onCreate={() => setCampaignModalOpen(true)} onManage={openCampaignManager} />
      )}

      {currentSection === "Applications" && <ApplicationQueue applications={applications} campaigns={campaigns} onReview={reviewApplication} onMessage={messageCreatorAboutApplication} showResolved />}
      {currentSection === "Collaborations" && <CollaborationsPanel collaborations={collaborations} onDeposit={depositEscrow} onApprove={approveDeliverable} onMessage={messageCreatorAboutCollaboration} depositErrors={depositErrors} />}

      {currentSection === "Messages" && (
        <MessagesPanel
          conversations={conversations}
          messages={conversationMessages}
          selectedConversationId={activeConversationId}
          message={brandMessage}
          onMessageChange={setBrandMessage}
          onDeleteConversation={deleteBrandConversation}
          onDeleteMessages={deleteBrandMessages}
          onRoomChange={setSelectedConversationId}
          onSend={sendBrandMessage}
        />
      )}

      {currentSection === "Discover Creators" && (
        <DiscoverPanel
          creators={filteredCreators}
          discoveryDecisions={marketplace.discoveryDecisions}
          filter={creatorFilter}
          search={creatorSearch}
          selectedCreator={selectedCreator}
          onDiscoveryDecision={decideCreatorDiscovery}
          onFilter={setCreatorFilter}
          onSearch={setCreatorSearch}
          onSelect={setSelectedCreator}
          onShortlist={(name) => addActivity(`${name} added to shortlist for campaign review.`, "blue")}
        />
      )}

      {currentSection === "Payments" && <PaymentsPanel collaborations={collaborations} paymentTotal={paymentTotal} wallet={brandWallet} ledger={brandLedger} onDeposit={depositEscrow} onApprove={approveDeliverable} onMessage={messageCreatorAboutCollaboration} depositErrors={depositErrors} />}
      {currentSection === "Brand Profile" && <BrandProfilePanel campaigns={campaigns} collaborations={collaborations} />}
      {currentSection === "Trust & Reports" && <TrustPanel collaborations={collaborations} />}

      {notificationOpen && <NotificationPanel activities={activities} onClose={() => setNotificationOpen(false)} />}
      {campaignModalOpen && (
        <CampaignFormModal
          form={form}
          onChange={setForm}
          onClose={() => {
            setCampaignModalOpen(false)
            setPendingCampaignFile(null)
          }}
          onFileChange={setPendingCampaignFile}
          onSubmit={submitCampaign}
        />
      )}
      {managedCampaign && (
        <CampaignManageModal
          key={managedCampaign.id}
          applications={applications}
          campaign={managedCampaign}
          collaborations={collaborations}
          onClose={() => setManagedCampaignId(null)}
          onPublish={publishCampaign}
          onUpdate={updateCampaign}
          onViewApplications={viewManagedCampaignApplications}
          onViewCollaborations={viewManagedCampaignCollaborations}
        />
      )}
      {lifecycleOpen && <LifecycleModal onClose={() => setLifecycleOpen(false)} />}
      {chatOpen && <SupportPanel onClose={() => setChatOpen(false)} />}
    </BrandDashboardShell>
  )
}
