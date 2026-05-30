"use client"

import { ClipboardList, Megaphone, ShieldCheck, UsersRound } from "lucide-react"
import { FormEvent, useMemo, useState } from "react"
import {
  MarketplaceCampaign as Campaign,
  ApplicationStatus,
  useMarketplaceStore,
} from "@/features/shared/marketplaceStore"
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
import { CampaignFormModal, LifecycleModal, SupportPanel } from "./BrandDashboardModals"
import { BrandDashboardHome } from "./BrandDashboardHome"
import { BrandDashboardShell } from "./BrandDashboardShell"
import { type Activity, type Section, creators, emptyCampaignForm } from "./brand-dashboard.shared"

export default function BrandDashboardOverview() {
  const marketplace = useMarketplaceStore()
  const [activeSection, setActiveSection] = useState<Section>("Dashboard")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [campaignModalOpen, setCampaignModalOpen] = useState(false)
  const [lifecycleOpen, setLifecycleOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [creatorFilter, setCreatorFilter] = useState<"ALL" | "NP" | "IN">("ALL")
  const [creatorSearch, setCreatorSearch] = useState("")
  const [brandMessage, setBrandMessage] = useState("")
  const [selectedRoomId, setSelectedRoomId] = useState(1)
  const [selectedCreator, setSelectedCreator] = useState(creators[0])
  const [form, setForm] = useState(emptyCampaignForm)
  const campaigns = marketplace.campaigns
  const applications = marketplace.applications
  const collaborations = marketplace.collaborations
  const [activities, setActivities] = useState<Activity[]>([
    { id: 1, message: "Aarati Rai applied to Himal Glow winter launch.", tone: "blue" },
    { id: 2, message: "Escrow is held for Sujata KC collaboration.", tone: "green" },
    { id: 3, message: "Trail Tea collaboration needs escrow deposit.", tone: "amber" },
  ])

  const analytics = useMemo(() => {
    const liveCampaigns = campaigns.filter((campaign) => campaign.status === "OPEN").length
    const totalApplications = campaigns.reduce((sum, campaign) => sum + campaign.applications, 0)
    const escrowHeld = collaborations.filter((collab) => collab.escrow === "HELD").length
    const reach = campaigns.reduce((sum, campaign) => sum + campaign.reach, 0)

    return [
      { label: "Live campaigns", value: liveCampaigns.toString(), detail: "OPEN and visible", icon: Megaphone },
      { label: "Applications", value: totalApplications.toString(), detail: "Pending review", icon: ClipboardList },
      { label: "Escrow held", value: escrowHeld.toString(), detail: "Chat unlocked", icon: ShieldCheck },
      { label: "Tracked reach", value: `${Math.round(reach / 1000)}K`, detail: "MVP campaign estimate", icon: UsersRound },
    ]
  }, [campaigns, collaborations])

  const filteredCreators = (creatorFilter === "ALL" ? creators : creators.filter((creator) => creator.country === creatorFilter)).filter((creator) => {
    const query = creatorSearch.trim().toLowerCase()
    if (!query) return true

    return [creator.name, creator.handle, creator.niche, creator.country].some((value) => value.toLowerCase().includes(query))
  })
  const pendingApplications = applications.filter((application) => application.status === "PENDING")
  const paymentTotal = collaborations.filter((collab) => collab.escrow === "HELD").length * 45000

  function addActivity(message: string, tone: Activity["tone"] = "blue") {
    setActivities((current) => [{ id: Date.now(), message, tone }, ...current].slice(0, 6))
  }

  function submitCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextCampaign: Campaign = {
      id: Date.now(),
      brand: "Himal Glow",
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

  function sendBrandMessage() {
    const message = brandMessage.trim()
    if (!message) return

    const room = collaborations.find((collab) => collab.id === selectedRoomId)
    marketplace.sendMessage(selectedRoomId, {
      sender: "brand",
      senderName: room?.brand ?? "Brand",
      body: message,
    })
    setBrandMessage("")
    addActivity("Message sent to creator collaboration room.", "blue")
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
          onManageCampaigns={() => setActiveSection("Campaigns")}
          onPublishCampaign={publishCampaign}
          onReviewApplication={reviewApplication}
        />
      )}

      {activeSection === "Campaigns" && (
        <CampaignList campaigns={campaigns} onPublish={publishCampaign} onCreate={() => setCampaignModalOpen(true)} onManage={(title) => addActivity(`${title} opened for campaign management.`, "blue")} />
      )}

      {activeSection === "Applications" && <ApplicationQueue applications={applications} campaigns={campaigns} onReview={reviewApplication} showResolved />}
      {activeSection === "Collaborations" && <CollaborationsPanel collaborations={collaborations} onDeposit={depositEscrow} onApprove={approveDeliverable} />}

      {activeSection === "Messages" && (
        <MessagesPanel
          collaborations={collaborations}
          messages={marketplace.messages}
          selectedRoomId={selectedRoomId}
          message={brandMessage}
          onMessageChange={setBrandMessage}
          onRoomChange={setSelectedRoomId}
          onSend={sendBrandMessage}
        />
      )}

      {activeSection === "Discover Creators" && (
        <DiscoverPanel
          creators={filteredCreators}
          filter={creatorFilter}
          search={creatorSearch}
          selectedCreator={selectedCreator}
          onFilter={setCreatorFilter}
          onSearch={setCreatorSearch}
          onSelect={setSelectedCreator}
          onShortlist={(name) => addActivity(`${name} added to shortlist for campaign review.`, "blue")}
        />
      )}

      {activeSection === "Payments" && <PaymentsPanel collaborations={collaborations} paymentTotal={paymentTotal} onDeposit={depositEscrow} onApprove={approveDeliverable} />}
      {activeSection === "Brand Profile" && <BrandProfilePanel campaigns={campaigns} collaborations={collaborations} />}
      {activeSection === "Trust & Reports" && <TrustPanel />}

      {notificationOpen && <NotificationPanel activities={activities} onClose={() => setNotificationOpen(false)} />}
      {campaignModalOpen && <CampaignFormModal form={form} onChange={setForm} onClose={() => setCampaignModalOpen(false)} onSubmit={submitCampaign} />}
      {lifecycleOpen && <LifecycleModal onClose={() => setLifecycleOpen(false)} />}
      {chatOpen && <SupportPanel onClose={() => setChatOpen(false)} />}
    </BrandDashboardShell>
  )
}
