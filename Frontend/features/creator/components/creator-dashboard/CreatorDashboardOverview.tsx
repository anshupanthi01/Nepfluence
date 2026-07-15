"use client"

import { BriefcaseBusiness, CheckCircle2, Clock3, ShieldCheck } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { getMyCreatorProfile } from "@/features/creator-profile/api/creatorProfileApi"
import {
  type Message,
  hideConversation as hideConversationApi,
  hideMessage as hideMessageApi,
  listConversations,
  listMessages as listMessagesApi,
  openConversation as openConversationApi,
  sendMessage as sendMessageApi,
} from "@/features/conversations/api/conversationApi"
import type { CreatorConversation } from "./panels/MessagesPanel"
import {
  MarketplaceLedgerEntry as LedgerEntry,
  MarketplaceWallet as Wallet,
} from "@/features/shared/marketplaceStore"
import {
  type Campaign as RealCampaign,
  listPublishedCampaigns,
} from "@/features/campaigns/api/campaignApi"
import {
  type Proposal,
  listMyProposals,
  sendProposal,
  withdrawProposal as withdrawProposalApi,
} from "@/features/campaigns/api/proposalApi"
import {
  type Collaboration as RealCollaboration,
  type DeliverableSubmissionPayload,
  type LedgerEntry as RealLedgerEntry,
  type Wallet as RealWallet,
  getLedger,
  getWallet,
  listMyCollaborations,
  submitDeliverable as submitDeliverableApi,
} from "@/features/collaborations/api/collaborationApi"
import { readMockSession } from "@/lib/auth"
import {
  ApplicationsPanel,
  CampaignsPanel,
  CollaborationsPanel,
  MessagesPanel,
  NotificationPanel,
  PayoutsPanel,
  ProfilePanel,
} from "./CreatorDashboardPanels"
import { DeliverableSubmissionModal, ProfileRequiredModal } from "./CreatorDashboardModals"
import { CreatorDashboardHome } from "./CreatorDashboardHome"
import { CreatorDashboardShell } from "./CreatorDashboardShell"
import {
  type Activity,
  type Collaboration,
  type CreatorApplicationStatus,
  type CreatorCampaign,
  type CreatorWorkspaceProfile,
  type Section,
  emptySubmissionForm,
  money,
  navItems,
} from "./creator-dashboard.shared"

const creatorSectionKey = "nepfluence-creator-active-section"

const creatorSectionPaths: Record<Section, string> = {
  Dashboard: "/creator/dashboard",
  "Find Campaigns": "/creator/campaigns",
  Applications: "/creator/applications",
  Collaborations: "/creator/collaborations",
  Messages: "/creator/messages",
  Payouts: "/creator/payouts",
  Profile: "/creator/profile",
}

const creatorPathSections = Object.fromEntries(
  Object.entries(creatorSectionPaths).map(([section, path]) => [path, section as Section]),
) as Record<string, Section>

function titleFromEmail(email?: string) {
  const base = email?.split("@")[0] || "Creator"
  return base
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function handleFromSession(email?: string, username?: string) {
  const base = (username || email?.split("@")[0] || "creator").toLowerCase().replace(/[^a-z0-9]+/g, "")
  return `@${base || "creator"}`
}

function deliverableCopy(state: Collaboration["state"], escrow: Collaboration["escrow"]) {
  if (state === "APPROVED") return "Approved. Payout released to creator wallet."
  if (state === "SUBMITTED") return "Video deliverable submitted. Waiting for brand review."
  if (escrow === "HELD") return "Chat unlocked. Waiting for first deliverable."
  return "Escrow required before chat unlocks."
}

function toUiCollaboration(collab: RealCollaboration, creatorUserId: string | undefined, fallbackCreatorName: string): Collaboration {
  const state = collab.state.toUpperCase() as Collaboration["state"]
  const escrow = collab.escrow_status.toUpperCase() as Collaboration["escrow"]

  return {
    id: collab.id,
    creatorUserId,
    creatorHandle: collab.creator?.handle,
    campaign: collab.campaign?.title ?? "Campaign",
    campaignId: collab.campaign?.id ?? 0,
    brand: collab.campaign?.brand_name ?? "Brand",
    creator: collab.creator?.full_name ?? fallbackCreatorName,
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

function readConnectedPlatforms(userId?: string) {
  if (typeof window === "undefined" || !userId) return []
  const raw = window.localStorage.getItem(`nepfluence-creator-socials:${userId}`)
  if (!raw) return []

  try {
    return JSON.parse(raw) as string[]
  } catch {
    return []
  }
}

function readCreatorSection(): Section {
  if (typeof window === "undefined") return "Profile"
  const pathSection = creatorPathSections[window.location.pathname]
  if (pathSection) return pathSection
  const storedSection = window.localStorage.getItem(creatorSectionKey) as Section | null
  return storedSection && navItems.some((item) => item.label === storedSection) ? storedSection : "Profile"
}

function emptyCreatorProfile(session?: ReturnType<typeof readMockSession>): CreatorWorkspaceProfile {
  const localPlatforms = readConnectedPlatforms(session?.userId)

  return {
    creator: session?.username || titleFromEmail(session?.email),
    handle: handleFromSession(session?.email, session?.username),
    country: "NP",
    niche: "Profile not set",
    followers: "0",
    bio: "Connect your social accounts and complete your profile to show brands what you create.",
    location: "Location not set",
    connectedPlatforms: localPlatforms,
    analytics: [
      { label: "Followers", value: "0", detail: "Connect socials" },
      { label: "Avg views", value: "0", detail: "Connect socials" },
      { label: "Total views", value: "0", detail: "Connect socials" },
      { label: "Videos", value: "0", detail: "Connect socials" },
      { label: "Engagement", value: "0%", detail: "Connect socials" },
      { label: "Accounts", value: localPlatforms.length.toString(), detail: "Connected" },
    ],
  }
}

export default function CreatorDashboardOverview() {
  const pathname = usePathname()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<Section>(() => readCreatorSection())
  const session = readMockSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [campaignSearch, setCampaignSearch] = useState("")
  const [creatorMessage, setCreatorMessage] = useState("")
  const [conversations, setConversations] = useState<CreatorConversation[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null)
  const [conversationMessages, setConversationMessages] = useState<Message[]>([])
  const [conversationsReloadToken, setConversationsReloadToken] = useState(0)
  const [submissionCollab, setSubmissionCollab] = useState<Collaboration | null>(null)
  const [submissionForm, setSubmissionForm] = useState(emptySubmissionForm)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [submittingDeliverable, setSubmittingDeliverable] = useState(false)
  const [profileRequiredOpen, setProfileRequiredOpen] = useState(false)
  const [creatorProfile, setCreatorProfile] = useState<CreatorWorkspaceProfile>(() => emptyCreatorProfile(session))
  const [activities, setActivities] = useState<Activity[]>([])
  const currentSection = creatorPathSections[pathname] ?? activeSection

  useEffect(() => {
    window.localStorage.setItem(creatorSectionKey, currentSection)
  }, [currentSection])

  useEffect(() => {
    let cancelled = false

    async function loadCreatorProfile() {
      const currentSession = readMockSession()
      const localPlatforms = readConnectedPlatforms(currentSession?.userId)

      try {
        const backendProfile = await getMyCreatorProfile()
        if (cancelled) return

        const youtubeStats = backendProfile?.youtube_stats?.[0]
        const backendPlatforms = backendProfile?.social_accounts?.map((account) => account.platform) ?? []
        const connectedPlatforms = Array.from(new Set([...localPlatforms, ...backendPlatforms]))
        const followers = youtubeStats?.subscribers ? youtubeStats.subscribers.toLocaleString("en-IN") : "0"

        setCreatorProfile({
          profileId: backendProfile?.id,
          creator: backendProfile?.full_name || currentSession?.username || titleFromEmail(currentSession?.email),
          handle: backendProfile?.social_accounts?.[0]?.youtube_handle || handleFromSession(currentSession?.email, currentSession?.username),
          country: "NP",
          niche: backendProfile?.niche ? backendProfile.niche.replace(/_/g, " ") : "Profile not set",
          followers,
          bio: backendProfile?.bio || "Connect your social accounts and complete your profile to show brands what you create.",
          location: "Location not set",
          connectedPlatforms,
          analytics: [
            { label: "Followers", value: followers, detail: connectedPlatforms.length ? "Connected socials" : "Connect socials" },
            { label: "Avg views", value: youtubeStats?.average_views ? youtubeStats.average_views.toLocaleString("en-IN") : "0", detail: "YouTube" },
            { label: "Total views", value: youtubeStats?.total_views ? youtubeStats.total_views.toLocaleString("en-IN") : "0", detail: "YouTube" },
            { label: "Videos", value: youtubeStats?.total_videos ? youtubeStats.total_videos.toString() : "0", detail: "YouTube" },
            { label: "Engagement", value: youtubeStats?.engagement_rate ? `${youtubeStats.engagement_rate}%` : "0%", detail: "Connected channels" },
            { label: "Accounts", value: connectedPlatforms.length.toString(), detail: "Connected" },
          ],
        })
      } catch {
        if (!cancelled) {
          setCreatorProfile((current) => ({
            ...emptyCreatorProfile(currentSession),
            creator: current.creator,
            handle: current.handle,
            connectedPlatforms: Array.from(new Set([...localPlatforms, ...current.connectedPlatforms])),
          }))
        }
      }
    }

    void loadCreatorProfile()

    return () => {
      cancelled = true
    }
  }, [])

  const [realCampaigns, setRealCampaigns] = useState<RealCampaign[]>([])
  const [realProposals, setRealProposals] = useState<Proposal[]>([])
  const [campaignsReloadToken, setCampaignsReloadToken] = useState(0)

  function refreshCampaignsAndProposals() {
    setCampaignsReloadToken((token) => token + 1)
  }

  useEffect(() => {
    let cancelled = false

    async function loadCampaignsAndProposals() {
      try {
        const published = await listPublishedCampaigns()
        if (!cancelled) setRealCampaigns(published)
      } catch {
        if (!cancelled) setRealCampaigns([])
      }

      try {
        const myProposals = await listMyProposals()
        if (!cancelled) setRealProposals(myProposals)
      } catch {
        if (!cancelled) setRealProposals([])
      }
    }

    void loadCampaignsAndProposals()

    return () => {
      cancelled = true
    }
  }, [campaignsReloadToken])

  const campaigns: CreatorCampaign[] = useMemo(() => {
    type CampaignSource = {
      id: number
      title: string
      brand: string
      niche: string
      country: "NP" | "IN"
      platform: string
      deadline: string
      budget: number
      status: string
      brief: string
    }

    const byId = new Map<number, CampaignSource>()

    realCampaigns.forEach((campaign) => {
      byId.set(campaign.id, {
        id: campaign.id,
        title: campaign.title,
        brand: campaign.brand_name,
        niche: campaign.niche ?? "",
        country: (campaign.country ?? "NP") as "NP" | "IN",
        platform: campaign.platform ?? "",
        deadline: campaign.deadline ?? "Not set",
        budget: campaign.budget_max,
        status: campaign.status.toUpperCase(),
        brief: campaign.description ?? "",
      })
    })

    realProposals.forEach((proposal) => {
      if (byId.has(proposal.campaign_id) || !proposal.campaign) return
      byId.set(proposal.campaign_id, {
        id: proposal.campaign_id,
        title: proposal.campaign.title,
        brand: proposal.campaign.brand_name,
        niche: "",
        country: "NP",
        platform: "",
        deadline: "Not set",
        budget: proposal.campaign.budget_max,
        status: proposal.campaign.status.toUpperCase(),
        brief: "",
      })
    })

    return Array.from(byId.values()).map((campaign) => {
      const proposal = realProposals.find((item) => item.campaign_id === campaign.id)
      return {
        id: campaign.id,
        brandUserId: undefined,
        brand: campaign.brand,
        title: campaign.title,
        niche: campaign.niche,
        budget: campaign.budget,
        country: campaign.country,
        platform: campaign.platform,
        applications: 0,
        accepted: 0,
        reach: 0,
        deadline: campaign.deadline,
        brief: campaign.brief,
        campaignStatus: campaign.status as CreatorCampaign["campaignStatus"],
        status: (proposal ? (proposal.status.toUpperCase() as CreatorApplicationStatus) : "NOT_APPLIED"),
        match: creatorProfile.niche !== "Profile not set" && campaign.niche.toLowerCase() === creatorProfile.niche.toLowerCase() ? 80 : 0,
      }
    })
  }, [realCampaigns, realProposals, creatorProfile.niche])

  const acceptedCampaigns = useMemo(() => campaigns.filter((campaign) => campaign.status === "ACCEPTED"), [campaigns])

  function refreshConversations() {
    setConversationsReloadToken((token) => token + 1)
  }

  useEffect(() => {
    let cancelled = false

    async function loadConversations() {
      if (acceptedCampaigns.length === 0) {
        if (!cancelled) setConversations([])
        return
      }
      try {
        const lists = await Promise.all(
          acceptedCampaigns.map((campaign) =>
            listConversations(campaign.id)
              .then((items) => items.map((item) => ({ ...item, campaignTitle: campaign.title, brandName: campaign.brand })))
              .catch(() => [] as CreatorConversation[]),
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
  }, [acceptedCampaigns.map((campaign) => campaign.id).join(","), conversationsReloadToken])

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
    () => realCollaborations.map((collab) => toUiCollaboration(collab, session?.userId, creatorProfile.creator)),
    [realCollaborations, session?.userId, creatorProfile.creator],
  )
  const creatorWallet = useMemo(() => toUiWallet(realWallet, session?.userId, "creator"), [realWallet, session?.userId])
  const creatorLedger = useMemo(() => toUiLedger(realLedger), [realLedger])

  const stats = useMemo(() => {
    const pendingApplications = campaigns.filter((campaign) => campaign.status === "PENDING").length
    const accepted = campaigns.filter((campaign) => campaign.status === "ACCEPTED").length
    const activeCollabs = collaborations.filter((collab) => ["IN_PROGRESS", "SUBMITTED"].includes(collab.state)).length
    const payable = collaborations.filter((collab) => collab.escrow === "HELD").reduce((sum, collab) => sum + collab.payout, 0)

    return [
      { label: "Pending applications", value: pendingApplications.toString(), detail: "Awaiting brand review", icon: Clock3 },
      { label: "Accepted campaigns", value: accepted.toString(), detail: "Ready for collaboration", icon: CheckCircle2 },
      { label: "Active work", value: activeCollabs.toString(), detail: "Deliverables in progress", icon: BriefcaseBusiness },
      { label: "Escrow protected", value: money(payable), detail: "Held before payout", icon: ShieldCheck },
    ]
  }, [campaigns, collaborations])

  const filteredCampaigns = campaigns.filter((campaign) => {
    const query = campaignSearch.trim().toLowerCase()
    if (!query) return true

    return [campaign.brand, campaign.title, campaign.niche, campaign.platform].some((value) => value.toLowerCase().includes(query))
  })

  function addActivity(message: string, tone: Activity["tone"] = "blue") {
    setActivities((current) => [{ id: Date.now(), message, tone }, ...current].slice(0, 6))
  }

  function applyToCampaign(id: number) {
    const campaign = campaigns.find((item) => item.id === id)

    if (!creatorProfile.profileId) {
      setProfileRequiredOpen(true)
      return
    }

    void (async () => {
      try {
        await sendProposal(id)
        refreshCampaignsAndProposals()
        goTo("Applications")
        addActivity(`Application sent to ${campaign?.brand ?? "brand"}.`, "blue")
      } catch (error) {
        addActivity(error instanceof Error ? error.message : "Could not send application.", "amber")
      }
    })()
  }

  function withdrawApplication(id: number) {
    const campaign = campaigns.find((item) => item.id === id)
    const proposal = realProposals.find((item) => item.campaign_id === id)
    if (!proposal) return

    void (async () => {
      try {
        await withdrawProposalApi(proposal.id)
        refreshCampaignsAndProposals()
        addActivity(`Application withdrawn from ${campaign?.brand ?? "brand"}.`, "amber")
      } catch (error) {
        addActivity(error instanceof Error ? error.message : "Could not withdraw application.", "amber")
      }
    })()
  }

  function messageBrandAboutCampaign(campaignId: number, _draftMessage: string) {
    const campaign = campaigns.find((item) => item.id === campaignId)
    if (campaign?.status !== "ACCEPTED") {
      addActivity(`Messaging with ${campaign?.brand ?? "the brand"} unlocks after they accept your application.`, "amber")
      return
    }

    void (async () => {
      try {
        const conversation = await openConversationApi(campaignId)
        refreshConversations()
        setSelectedConversationId(conversation.id)
        goTo("Messages")
      } catch (error) {
        addActivity(error instanceof Error ? error.message : "Could not open conversation.", "amber")
      }
    })()
  }

  function submitDeliverable(id: number) {
    const collab = collaborations.find((item) => item.id === id)
    if (!collab) return

    setSubmissionCollab(collab)
    setSubmissionForm({
      ...emptySubmissionForm,
      caption: `Draft caption for ${collab.campaign}`,
      notes: "First video draft is ready for brand review. I can revise hook, CTA, or product close-up if needed.",
    })
    setSubmissionError(null)
  }

  function closeSubmissionModal() {
    setSubmissionCollab(null)
    setSubmissionForm(emptySubmissionForm)
    setSubmissionError(null)
  }

  function submitDeliverableForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!submissionCollab || !submissionForm.videoUrl.trim() || submittingDeliverable) return

    const collabId = submissionCollab.id
    const brandName = submissionCollab.brand
    const payload: DeliverableSubmissionPayload = {
      video_url: submissionForm.videoUrl.trim(),
      post_url: submissionForm.postUrl.trim() || undefined,
      caption: submissionForm.caption.trim() || undefined,
      notes: submissionForm.notes.trim() || undefined,
      aspect_ratio: submissionForm.aspectRatio || undefined,
      duration: submissionForm.duration || undefined,
      brief_matched: submissionForm.checklist.briefMatched,
      usage_rights: submissionForm.checklist.usageRights,
      no_copyright_music: submissionForm.checklist.noCopyrightMusic,
    }

    setSubmissionError(null)
    setSubmittingDeliverable(true)

    void (async () => {
      try {
        await submitDeliverableApi(collabId, payload)
        refreshCollaborations()
        addActivity(`Video submitted to ${brandName} for review.`, "blue")
        setSubmissionCollab(null)
        setSubmissionForm(emptySubmissionForm)
      } catch (error) {
        refreshCollaborations()
        setSubmissionError(error instanceof Error ? error.message : "Could not submit deliverable.")
      } finally {
        setSubmittingDeliverable(false)
      }
    })()
  }

  function goTo(section: Section) {
    setActiveSection(section)
    const path = creatorSectionPaths[section]
    if (path && path !== pathname) router.push(path)
    setMobileMenuOpen(false)
  }

  function sendCreatorMessage() {
    const body = creatorMessage.trim()
    if (!body) return
    const conversation = conversations.find((item) => item.id === activeConversationId)
    if (!conversation) return

    void (async () => {
      try {
        await sendMessageApi(conversation.campaign_id, conversation.id, body)
        setCreatorMessage("")
        refreshConversations()
        addActivity(`Message sent to ${conversation.brandName}.`, "blue")
      } catch (error) {
        addActivity(error instanceof Error ? error.message : "Could not send message.", "amber")
      }
    })()
  }

  function deleteCreatorConversation(conversationId: number) {
    const conversation = conversations.find((item) => item.id === conversationId)
    if (!conversation) return

    void (async () => {
      try {
        await hideConversationApi(conversation.campaign_id, conversation.id)
        refreshConversations()
        addActivity(`Conversation with ${conversation.brandName} hidden.`, "amber")
      } catch (error) {
        addActivity(error instanceof Error ? error.message : "Could not hide conversation.", "amber")
      }
    })()
  }

  function deleteCreatorMessages(messageIds: number[]) {
    if (!messageIds.length) return
    const conversation = conversations.find((item) => item.id === activeConversationId)
    if (!conversation) return

    void (async () => {
      try {
        await Promise.all(messageIds.map((messageId) => hideMessageApi(conversation.campaign_id, conversation.id, messageId)))
        setConversationMessages((current) => current.filter((item) => !messageIds.includes(item.id)))
        addActivity(`${messageIds.length} message${messageIds.length === 1 ? "" : "s"} permanently deleted.`, "amber")
      } catch (error) {
        addActivity(error instanceof Error ? error.message : "Could not delete messages.", "amber")
      }
    })()
  }

  return (
    <CreatorDashboardShell
      activeSection={currentSection}
      mobileMenuOpen={mobileMenuOpen}
      onCloseMobileMenu={() => setMobileMenuOpen(false)}
      onFindCampaigns={() => goTo("Find Campaigns")}
      onNavigate={goTo}
      onOpenMobileMenu={() => setMobileMenuOpen(true)}
      onOpenNotifications={() => setNotificationOpen((open) => !open)}
    >
      {currentSection === "Dashboard" && (
        <CreatorDashboardHome
          activities={activities}
          campaigns={filteredCampaigns}
          collaborations={collaborations}
          campaignSearch={campaignSearch}
          creatorProfile={creatorProfile}
          stats={stats}
          onApply={applyToCampaign}
          onBrowseCampaigns={() => goTo("Find Campaigns")}
          onEditProfile={() => goTo("Profile")}
          onMessageBrand={messageBrandAboutCampaign}
          onSearch={setCampaignSearch}
          onSubmit={submitDeliverable}
          onWithdraw={withdrawApplication}
        />
      )}

      {currentSection === "Find Campaigns" && (
        <CampaignsPanel
          campaigns={filteredCampaigns}
          search={campaignSearch}
          onSearch={setCampaignSearch}
          onApply={applyToCampaign}
          onMessageBrand={messageBrandAboutCampaign}
          onWithdraw={withdrawApplication}
        />
      )}
      {currentSection === "Applications" && <ApplicationsPanel campaigns={campaigns} onWithdraw={withdrawApplication} />}
      {currentSection === "Collaborations" && <CollaborationsPanel collaborations={collaborations} onSubmit={submitDeliverable} />}
      {currentSection === "Messages" && (
        <MessagesPanel
          conversations={conversations}
          messages={conversationMessages}
          selectedConversationId={activeConversationId}
          message={creatorMessage}
          onMessageChange={setCreatorMessage}
          onDeleteConversation={deleteCreatorConversation}
          onDeleteMessages={deleteCreatorMessages}
          onRoomChange={setSelectedConversationId}
          onSend={sendCreatorMessage}
        />
      )}
      {currentSection === "Payouts" && <PayoutsPanel collaborations={collaborations} wallet={creatorWallet} ledger={creatorLedger} onSubmit={submitDeliverable} />}
      {currentSection === "Profile" && <ProfilePanel creatorProfile={creatorProfile} onProfileChange={setCreatorProfile} />}

      {notificationOpen && <NotificationPanel activities={activities} onClose={() => setNotificationOpen(false)} />}
      {submissionCollab && (
        <DeliverableSubmissionModal
          collab={submissionCollab}
          form={submissionForm}
          error={submissionError}
          submitting={submittingDeliverable}
          onChange={setSubmissionForm}
          onClose={closeSubmissionModal}
          onSubmit={submitDeliverableForm}
        />
      )}
      {profileRequiredOpen && (
        <ProfileRequiredModal
          onClose={() => setProfileRequiredOpen(false)}
          onGoToProfile={() => {
            setProfileRequiredOpen(false)
            goTo("Profile")
          }}
        />
      )}
    </CreatorDashboardShell>
  )
}
