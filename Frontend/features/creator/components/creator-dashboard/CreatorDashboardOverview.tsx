"use client"

import { BriefcaseBusiness, CheckCircle2, Clock3, ShieldCheck } from "lucide-react"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { getMyCreatorProfile } from "@/features/creator-profile/api/creatorProfileApi"
import { useMarketplaceStore } from "@/features/shared/marketplaceStore"
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
import { DeliverableSubmissionModal } from "./CreatorDashboardModals"
import { CreatorDashboardHome } from "./CreatorDashboardHome"
import { CreatorDashboardShell } from "./CreatorDashboardShell"
import {
  type Activity,
  type Collaboration,
  type CreatorCampaign,
  type CreatorWorkspaceProfile,
  type Section,
  emptySubmissionForm,
  money,
} from "./creator-dashboard.shared"

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

export default function CreatorDashboardOverview() {
  const marketplace = useMarketplaceStore()
  const [activeSection, setActiveSection] = useState<Section>("Profile")
  const session = readMockSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [campaignSearch, setCampaignSearch] = useState("")
  const [creatorMessage, setCreatorMessage] = useState("")
  const [selectedRoomId, setSelectedRoomId] = useState(1)
  const [submissionCollab, setSubmissionCollab] = useState<Collaboration | null>(null)
  const [submissionForm, setSubmissionForm] = useState(emptySubmissionForm)
  const [creatorProfile, setCreatorProfile] = useState<CreatorWorkspaceProfile>(() => ({
    creator: session?.username || titleFromEmail(session?.email),
    handle: handleFromSession(session?.email, session?.username),
    country: "NP",
    niche: "Profile not set",
    followers: "0",
    bio: "Connect your social accounts and complete your profile to show brands what you create.",
    location: "Location not set",
    connectedPlatforms: readConnectedPlatforms(session?.userId),
    analytics: [
      { label: "Followers", value: "0", detail: "Connect socials" },
      { label: "Avg views", value: "0", detail: "Connect socials" },
      { label: "Total views", value: "0", detail: "Connect socials" },
      { label: "Videos", value: "0", detail: "Connect socials" },
      { label: "Engagement", value: "0%", detail: "Connect socials" },
      { label: "Accounts", value: readConnectedPlatforms(session?.userId).length.toString(), detail: "Connected" },
    ],
  }))
  const [activities, setActivities] = useState<Activity[]>([])

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
          setCreatorProfile((current) => ({ ...current, connectedPlatforms: localPlatforms }))
        }
      }
    }

    void loadCreatorProfile()

    return () => {
      cancelled = true
    }
  }, [])

  const creatorApplications = marketplace.applications.filter((application) =>
    application.creatorUserId ? application.creatorUserId === session?.userId : application.handle === creatorProfile.handle,
  )
  const creatorApplicationCampaignIds = useMemo(() => new Set(creatorApplications.map((application) => application.campaignId)), [creatorApplications])

  const campaigns: CreatorCampaign[] = marketplace.campaigns
    .filter((campaign) => campaign.status === "OPEN" || creatorApplicationCampaignIds.has(campaign.id))
    .map((campaign) => {
      const application = creatorApplications.find((item) => item.campaignId === campaign.id)

      return {
        ...campaign,
        campaignStatus: campaign.status,
        status: application?.status ?? "NOT_APPLIED",
        match: application?.match ?? (creatorProfile.niche !== "Profile not set" && campaign.niche.toLowerCase() === creatorProfile.niche.toLowerCase() ? 80 : 0),
      }
    })

  const collaborations = marketplace.collaborations.filter((collab) =>
    collab.creatorUserId ? collab.creatorUserId === session?.userId : collab.creator === creatorProfile.creator,
  )
  const activeRoomId = collaborations.some((collab) => collab.id === selectedRoomId) ? selectedRoomId : collaborations[0]?.id
  const creatorWallet = marketplace.getWallet(session?.userId, "creator")
  const creatorLedger = marketplace.ledger.filter((entry) => collaborations.some((collab) => collab.id === entry.collaborationId))

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

  function goTo(section: Section) {
    setActiveSection(section)
    setMobileMenuOpen(false)
  }

  function sendCreatorMessage() {
    const message = creatorMessage.trim()
    if (!message) return
    const room = collaborations.find((collab) => collab.id === activeRoomId)
    if (!room) return

    marketplace.sendMessage(room.id, {
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
          creatorProfile={creatorProfile}
          stats={stats}
          onApply={applyToCampaign}
          onBrowseCampaigns={() => setActiveSection("Find Campaigns")}
          onEditProfile={() => setActiveSection("Profile")}
          onSearch={setCampaignSearch}
          onSubmit={submitDeliverable}
          onWithdraw={withdrawApplication}
        />
      )}

      {activeSection === "Find Campaigns" && <CampaignsPanel campaigns={filteredCampaigns} search={campaignSearch} onSearch={setCampaignSearch} onApply={applyToCampaign} onWithdraw={withdrawApplication} />}
      {activeSection === "Applications" && <ApplicationsPanel campaigns={campaigns} onWithdraw={withdrawApplication} />}
      {activeSection === "Collaborations" && <CollaborationsPanel collaborations={collaborations} onSubmit={submitDeliverable} />}
      {activeSection === "Messages" && (
        <MessagesPanel
          collaborations={collaborations}
          messages={marketplace.messages}
          selectedRoomId={activeRoomId ?? selectedRoomId}
          message={creatorMessage}
          onMessageChange={setCreatorMessage}
          onRoomChange={setSelectedRoomId}
          onSend={sendCreatorMessage}
        />
      )}
      {activeSection === "Payouts" && <PayoutsPanel collaborations={collaborations} wallet={creatorWallet} ledger={creatorLedger} onSubmit={submitDeliverable} />}
      {activeSection === "Profile" && <ProfilePanel creatorProfile={creatorProfile} onProfileChange={setCreatorProfile} />}

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
