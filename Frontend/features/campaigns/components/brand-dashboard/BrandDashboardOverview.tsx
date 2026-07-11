"use client"

import { ClipboardList, Megaphone, ShieldCheck, UsersRound } from "lucide-react"
import { FormEvent, useEffect, useMemo, useRef, useState } from "react"
import { apiClient } from "@/lib/api-client"
import { hideConversation as hideConversationApi, hideMessage as hideMessageApi } from "@/features/conversations/api/conversationApi"
import {
  MarketplaceCampaign as Campaign,
  ApplicationStatus,
  CreatorDiscoveryDecision,
  useMarketplaceStore,
} from "@/features/shared/marketplaceStore"
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

const creatorImages = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=320&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=320&q=80",
  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=320&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=320&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=320&q=80",
]

function directoryProfileToCreator(profile: CreatorDirectoryProfile, index: number): Creator {
  return {
    name: profile.full_name,
    handle: profile.handle,
    country: profile.country,
    niche: profile.niche,
    followers: profile.followers || "0",
    rating: profile.rating || "New",
    image: profile.image && profile.image !== "kei xaina" ? profile.image : creatorImages[index % creatorImages.length],
    platforms: profile.platforms ?? [],
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

function readBrandSection(): Section {
  if (typeof window === "undefined") return "Discover Creators"

  const startSection = window.localStorage.getItem(startSectionKey) as Section | null
  if (startSection && navItems.some((item) => item.label === startSection)) {
    window.localStorage.removeItem(startSectionKey)
    return startSection
  }

  const storedSection = window.localStorage.getItem(brandSectionKey) as Section | null
  return storedSection && navItems.some((item) => item.label === storedSection) ? storedSection : "Discover Creators"
}

export default function BrandDashboardOverview() {
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
  const [brandMessage, setBrandMessage] = useState("")
  const [selectedRoomId, setSelectedRoomId] = useState(1)
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null)
  const [form, setForm] = useState(emptyCampaignForm)
  const campaigns = useMemo(
    () =>
      marketplace.campaigns.filter((campaign) =>
        campaign.brandUserId ? campaign.brandUserId === session?.userId : campaign.brand === currentBrandName,
      ),
    [currentBrandName, marketplace.campaigns, session?.userId],
  )
  const ownedCampaignIds = useMemo(() => new Set(campaigns.map((campaign) => campaign.id)), [campaigns])
  const applications = useMemo(
    () => marketplace.applications.filter((application) => ownedCampaignIds.has(application.campaignId)),
    [marketplace.applications, ownedCampaignIds],
  )
  const collaborations = useMemo(
    () =>
      marketplace.collaborations.filter((collab) =>
        (collab.brandUserId ? collab.brandUserId === session?.userId : ownedCampaignIds.has(collab.campaignId)) &&
        !collab.hiddenForBrandAt,
      ),
    [marketplace.collaborations, ownedCampaignIds, session?.userId],
  )
  const activeRoomId = collaborations.some((collab) => collab.id === selectedRoomId) ? selectedRoomId : collaborations[0]?.id
  const [activities, setActivities] = useState<Activity[]>([])

  useEffect(() => {
    window.localStorage.setItem(brandSectionKey, activeSection)
  }, [activeSection])

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


  const idCounter = useRef(0)

  function nextUiId() {
    idCounter.current += 1
    return Date.now() * 1000 + idCounter.current
  }

  const analytics = useMemo(() => {
    const liveCampaigns = campaigns.filter((campaign) => campaign.status === "PUBLISHED").length
    const totalApplications = campaigns.reduce((sum, campaign) => sum + campaign.applications, 0)
    const escrowHeld = collaborations.filter((collab) => collab.escrow === "HELD").length
    const reach = campaigns.reduce((sum, campaign) => sum + campaign.reach, 0)

    return [
      { label: "Live campaigns", value: liveCampaigns.toString(), detail: "Published and visible", icon: Megaphone },
      { label: "Applications", value: totalApplications.toString(), detail: "Pending review", icon: ClipboardList },
      { label: "Escrow held", value: escrowHeld.toString(), detail: "Chat unlocked", icon: ShieldCheck },
      { label: "Tracked reach", value: `${Math.round(reach / 1000)}K`, detail: "MVP campaign estimate", icon: UsersRound },
    ]
  }, [campaigns, collaborations])

  const filteredCreators = (creatorFilter === "ALL" ? directoryCreators : directoryCreators.filter((creator) => creator.country === creatorFilter)).filter((creator) => {
    const query = creatorSearch.trim().toLowerCase()
    if (!query) return true

    return [creator.name, creator.handle, creator.niche, creator.country].some((value) => value.toLowerCase().includes(query))
  })
  const pendingApplications = applications.filter((application) => application.status === "PENDING")
  const managedCampaign = campaigns.find((campaign) => campaign.id === managedCampaignId) ?? null
  const brandWallet = marketplace.getWallet(session?.userId, "brand")
  const brandLedger = marketplace.ledger.filter((entry) => collaborations.some((collab) => collab.id === entry.collaborationId))
  const paymentTotal = collaborations.filter((collab) => collab.escrow === "HELD").reduce((sum, collab) => sum + collab.payout, 0)

  function addActivity(message: string, tone: Activity["tone"] = "blue") {
    setActivities((current) => [{ id: nextUiId(), message, tone }, ...current].slice(0, 6))
  }

  function submitCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextCampaign: Campaign = {
      id: nextUiId(),
      brandUserId: session?.userId,
      brand: currentBrandName,
      title: form.title.trim() || "Untitled campaign",
      niche: form.niche,
      budget: Number(form.budget) || 0,
      country: form.country,
      platform: form.platform,
      status: "DRAFT",
      applications: 0,
      accepted: 0,
      reach: 0,
      deadline: form.deadline || "Not set",
      brief: form.brief.trim() || "Draft brief pending.",
    }

    marketplace.createCampaign(nextCampaign)
    setForm(emptyCampaignForm)
    setCampaignModalOpen(false)
    setActiveSection("Campaigns")
    addActivity(`${nextCampaign.title} created as DRAFT.`, "blue")
  }

  function publishCampaign(id: number) {
    marketplace.publishCampaign(id)
    addActivity("Campaign published and visible to influencers.", "green")
  }

  function updateCampaign(id: number, updates: Partial<Pick<Campaign, "status" | "budget" | "deadline">>) {
    marketplace.updateCampaign(id, updates)
    addActivity("Campaign settings updated.", "green")
  }

  function openCampaignManager(campaign: Campaign) {
    setManagedCampaignId(campaign.id)
    addActivity(`${campaign.title} opened in campaign manager.`, "blue")
  }

  function reviewApplication(id: number, status: ApplicationStatus) {
    const application = applications.find((item) => item.id === id)
    if (!application) return

    marketplace.reviewApplication(id, status)

    if (status === "ACCEPTED") {
      addActivity(`${application.creator} accepted. Escrow deposit is now required.`, "amber")
      setActiveSection("Collaborations")
    } else {
      addActivity(`${application.creator} rejected and notified.`, "red")
    }
  }

  function decideCreatorDiscovery(creator: Creator, status: CreatorDiscoveryDecision["status"]) {
    marketplace.decideCreatorDiscovery({ creator: creator.name, handle: creator.handle }, status)
    addActivity(`${creator.name} ${status === "SELECTED" ? "moved to selected creators" : "moved to rejected creators"}.`, status === "SELECTED" ? "blue" : "red")
  }

  function depositEscrow(id: number) {
    marketplace.depositEscrow(id)
    addActivity("Escrow deposited. Collaboration chat is unlocked.", "green")
  }

  function approveDeliverable(id: number) {
    marketplace.approveDeliverable(id)
    addActivity("Deliverable approved. Payment release queued.", "green")
  }

  function goTo(section: Section) {
    setActiveSection(section)
    setMobileMenuOpen(false)
  }

  function viewManagedCampaignApplications() {
    setManagedCampaignId(null)
    setActiveSection("Applications")
  }

  function viewManagedCampaignCollaborations() {
    setManagedCampaignId(null)
    setActiveSection("Collaborations")
  }

  function sendBrandMessage() {
    const message = brandMessage.trim()
    if (!message) return

    const room = collaborations.find((collab) => collab.id === activeRoomId)
    if (!room) return
    marketplace.sendMessage(room.id, {
      campaignId: room.campaignId,
      brandUserId: room.brandUserId,
      creatorUserId: room.creatorUserId,
      sender: "brand",
      senderName: room.brand,
      body: message,
    })
    setBrandMessage("")
    addActivity("Message sent to creator collaboration room.", "blue")
  }

  function deleteBrandConversation(roomId: number) {
    const room = collaborations.find((collab) => collab.id === roomId)
    if (!room) return
    marketplace.hideConversation(room.id, "brand")
    void hideConversationApi(room.campaignId, room.id).catch(() => undefined)
    addActivity(`Conversation with ${room.creator} hidden.`, "amber")
  }

  function deleteBrandMessage(messageId: number) {
    const message = marketplace.messages.find((item) => item.id === messageId)
    const room = collaborations.find((collab) => collab.id === message?.roomId)
    if (!message || !room) return
    marketplace.hideMessage(message.id, "brand")
    void hideMessageApi(room.campaignId, room.id, message.id).catch(() => undefined)
  }

  return (
    <BrandDashboardShell
      activeSection={activeSection}
      mobileMenuOpen={mobileMenuOpen}
      onCloseMobileMenu={() => setMobileMenuOpen(false)}
      onNavigate={goTo}
      onOpenCampaign={() => setCampaignModalOpen(true)}
      onOpenLifecycle={() => setLifecycleOpen(true)}
      onOpenMobileMenu={() => setMobileMenuOpen(true)}
      onOpenNotifications={() => setNotificationOpen((open) => !open)}
      onOpenSupport={() => setChatOpen(true)}
    >
      {activeSection === "Dashboard" && (
        <BrandDashboardHome
          activities={activities}
          analytics={analytics}
          campaigns={campaigns}
          pendingApplications={pendingApplications}
          onCreateCampaign={() => setCampaignModalOpen(true)}
          onDiscoverCreators={() => setActiveSection("Discover Creators")}
          onManageCampaign={openCampaignManager}
          onPublishCampaign={publishCampaign}
          onReviewApplication={reviewApplication}
        />
      )}

      {activeSection === "Campaigns" && (
        <CampaignList campaigns={campaigns} onPublish={publishCampaign} onCreate={() => setCampaignModalOpen(true)} onManage={openCampaignManager} />
      )}

      {activeSection === "Applications" && <ApplicationQueue applications={applications} campaigns={campaigns} onReview={reviewApplication} showResolved />}
      {activeSection === "Collaborations" && <CollaborationsPanel collaborations={collaborations} onDeposit={depositEscrow} onApprove={approveDeliverable} />}

      {activeSection === "Messages" && (
        <MessagesPanel
          collaborations={collaborations}
          messages={marketplace.messages}
          selectedRoomId={activeRoomId ?? selectedRoomId}
          message={brandMessage}
          onMessageChange={setBrandMessage}
          onDeleteConversation={deleteBrandConversation}
          onDeleteMessage={deleteBrandMessage}
          onRoomChange={setSelectedRoomId}
          onSend={sendBrandMessage}
        />
      )}

      {activeSection === "Discover Creators" && (
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

      {activeSection === "Payments" && <PaymentsPanel collaborations={collaborations} paymentTotal={paymentTotal} wallet={brandWallet} ledger={brandLedger} onDeposit={depositEscrow} onApprove={approveDeliverable} />}
      {activeSection === "Brand Profile" && <BrandProfilePanel campaigns={campaigns} collaborations={collaborations} />}
      {activeSection === "Trust & Reports" && <TrustPanel collaborations={collaborations} />}

      {notificationOpen && <NotificationPanel activities={activities} onClose={() => setNotificationOpen(false)} />}
      {campaignModalOpen && <CampaignFormModal form={form} onChange={setForm} onClose={() => setCampaignModalOpen(false)} onSubmit={submitCampaign} />}
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
