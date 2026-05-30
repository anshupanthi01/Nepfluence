"use client"

import { BriefcaseBusiness, CheckCircle2, Clock3, ShieldCheck } from "lucide-react"
import { FormEvent, useMemo, useState } from "react"
import { useMarketplaceStore } from "@/features/shared/marketplaceStore"
import {
  ApplicationsPanel,
  CampaignsPanel,
  CollaborationsPanel,
  MessagesPanel,
  NotificationPanel,
  PayoutsPanel,
  ProfilePanel,
} from "./CreatorDashboardPanels"
import { DeliverableSubmissionModal } from "./CreatorDashboardModals"
import { CreatorDashboardHome } from "./CreatorDashboardHome"
import { CreatorDashboardShell } from "./CreatorDashboardShell"
import {
  type Activity,
  type Collaboration,
  type CreatorCampaign,
  type Section,
  emptySubmissionForm,
  money,
} from "./creator-dashboard.shared"

export default function CreatorDashboardOverview() {
  const marketplace = useMarketplaceStore()
  const [activeSection, setActiveSection] = useState<Section>("Dashboard")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [campaignSearch, setCampaignSearch] = useState("")
  const [creatorMessage, setCreatorMessage] = useState("")
  const [selectedRoomId, setSelectedRoomId] = useState(1)
  const [submissionCollab, setSubmissionCollab] = useState<Collaboration | null>(null)
  const [submissionForm, setSubmissionForm] = useState(emptySubmissionForm)
  const [activities, setActivities] = useState<Activity[]>([
    { id: 1, message: "Trail Tea escrow is held. Chat and deliverables are unlocked.", tone: "green" },
    { id: 2, message: "8848 Momo House application is waiting on brand review.", tone: "amber" },
    { id: 3, message: "Himal Glow campaign matches your Beauty UGC profile.", tone: "blue" },
  ])

  const creatorProfile = {
    creator: "Aarati Rai",
    handle: "@aaratiugc",
    country: "NP" as const,
    niche: "Beauty UGC",
    followers: "42K",
  }

  const campaigns: CreatorCampaign[] = marketplace.campaigns
    .filter((campaign) => campaign.status === "OPEN" || marketplace.applications.some((application) => application.campaignId === campaign.id && application.handle === creatorProfile.handle))
    .map((campaign) => {
      const application = marketplace.applications.find((item) => item.campaignId === campaign.id && item.handle === creatorProfile.handle)

      return {
        ...campaign,
        campaignStatus: campaign.status,
        status: application?.status ?? "NOT_APPLIED",
        match: application?.match ?? (campaign.niche.toLowerCase().includes("beauty") ? 96 : campaign.country === "NP" ? 89 : 82),
      }
    })

  const collaborations = marketplace.collaborations.filter((collab) => collab.creator === creatorProfile.creator)

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
    marketplace.applyToCampaign(id, { ...creatorProfile, match: campaign?.match })
    setActiveSection("Applications")
    addActivity(`Application sent to ${campaign?.brand ?? "brand"}.`, "blue")
  }

  function withdrawApplication(id: number) {
    const campaign = campaigns.find((item) => item.id === id)
    marketplace.withdrawApplication(id, creatorProfile.handle)
    addActivity(`Application withdrawn from ${campaign?.brand ?? "brand"}.`, "amber")
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
  }

  function submitDeliverableForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!submissionCollab || !submissionForm.videoUrl.trim()) return

    marketplace.markSubmitted(submissionCollab.id, {
      ...submissionForm,
      videoUrl: submissionForm.videoUrl.trim(),
      postUrl: submissionForm.postUrl.trim(),
      caption: submissionForm.caption.trim(),
      notes: submissionForm.notes.trim(),
    })
    addActivity(`Video submitted to ${submissionCollab.brand} for review.`, "blue")
    setSubmissionCollab(null)
    setSubmissionForm(emptySubmissionForm)
  }

  function markPaid(id: number) {
    marketplace.approveDeliverable(id)
    addActivity("Payout released to creator wallet.", "green")
  }

  function goTo(section: Section) {
    setActiveSection(section)
    setMobileMenuOpen(false)
  }

  function sendCreatorMessage() {
    const message = creatorMessage.trim()
    if (!message) return

    marketplace.sendMessage(selectedRoomId, {
      sender: "creator",
      senderName: creatorProfile.creator,
      body: message,
    })
    setCreatorMessage("")
    addActivity("Message sent to brand collaboration room.", "blue")
  }

  return (
    <CreatorDashboardShell
      activeSection={activeSection}
      mobileMenuOpen={mobileMenuOpen}
      onCloseMobileMenu={() => setMobileMenuOpen(false)}
      onFindCampaigns={() => setActiveSection("Find Campaigns")}
      onNavigate={goTo}
      onOpenMobileMenu={() => setMobileMenuOpen(true)}
      onOpenNotifications={() => setNotificationOpen((open) => !open)}
    >
      {activeSection === "Dashboard" && (
        <CreatorDashboardHome
          activities={activities}
          campaigns={filteredCampaigns}
          collaborations={collaborations}
          campaignSearch={campaignSearch}
          stats={stats}
          onApply={applyToCampaign}
          onBrowseCampaigns={() => setActiveSection("Find Campaigns")}
          onEditProfile={() => setActiveSection("Profile")}
          onMarkPaid={markPaid}
          onSearch={setCampaignSearch}
          onSubmit={submitDeliverable}
          onWithdraw={withdrawApplication}
        />
      )}

      {activeSection === "Find Campaigns" && <CampaignsPanel campaigns={filteredCampaigns} search={campaignSearch} onSearch={setCampaignSearch} onApply={applyToCampaign} onWithdraw={withdrawApplication} />}
      {activeSection === "Applications" && <ApplicationsPanel campaigns={campaigns} onWithdraw={withdrawApplication} />}
      {activeSection === "Collaborations" && <CollaborationsPanel collaborations={collaborations} onSubmit={submitDeliverable} onMarkPaid={markPaid} />}
      {activeSection === "Messages" && (
        <MessagesPanel
          collaborations={collaborations}
          messages={marketplace.messages}
          selectedRoomId={selectedRoomId}
          message={creatorMessage}
          onMessageChange={setCreatorMessage}
          onRoomChange={setSelectedRoomId}
          onSend={sendCreatorMessage}
        />
      )}
      {activeSection === "Payouts" && <PayoutsPanel collaborations={collaborations} onSubmit={submitDeliverable} onMarkPaid={markPaid} />}
      {activeSection === "Profile" && <ProfilePanel />}

      {notificationOpen && <NotificationPanel activities={activities} onClose={() => setNotificationOpen(false)} />}
      {submissionCollab && (
        <DeliverableSubmissionModal
          collab={submissionCollab}
          form={submissionForm}
          onChange={setSubmissionForm}
          onClose={() => setSubmissionCollab(null)}
          onSubmit={submitDeliverableForm}
        />
      )}
    </CreatorDashboardShell>
  )
}
