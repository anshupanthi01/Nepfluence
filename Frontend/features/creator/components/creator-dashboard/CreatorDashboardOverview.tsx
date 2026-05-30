/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import Link from "next/link"
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  BriefcaseBusiness,
  Camera,
  CheckCircle2,
  Clock3,
  CreditCard,
  Edit3,
  Eye,
  FileText,
  Heart,
  IndianRupee,
  LayoutDashboard,
  Menu,
  MessageSquare,
  PlayCircle,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Upload,
  UserRound,
  WalletCards,
  X,
} from "lucide-react"
import { FormEvent, ReactNode, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  CampaignStatus,
  DeliverableSubmission,
  MarketplaceCampaign,
  MarketplaceCollaboration,
  useMarketplaceStore,
} from "@/features/shared/marketplaceStore"
import {
  ActivityPanel,
  ApplicationsPanel,
  CampaignsPanel,
  CollaborationsPanel,
  MessagesPanel,
  MetricCard,
  MiniStat,
  NotificationPanel,
  PayoutsPanel,
  ProfilePanel,
} from "./CreatorDashboardPanels"
import { DeliverableSubmissionModal } from "./CreatorDashboardModals"
import {
  type Activity,
  type Collaboration,
  type CreatorCampaign,
  type Section,
  creatorProfileImage,
  emptySubmissionForm,
  money,
  navItems,
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

  const shell = (
    <aside className="flex h-full flex-col bg-white">
      <Link href="/" className="flex h-16 items-center gap-3 border-b border-[#eceef5] px-5" aria-label="Nepfluence home">
        <span className="grid size-9 rotate-[-35deg] grid-cols-3 gap-1">
          {Array.from({ length: 9 }).map((_, index) => (
            <span key={index} className="rounded-full bg-[#7894ff]" style={{ opacity: index % 2 === 0 ? 1 : 0.58 }} />
          ))}
        </span>
        <span className="text-xl font-black text-[#17171f]">Nepfluence</span>
      </Link>

      <nav className="flex-1 space-y-1 px-3 py-5">
        {navItems.map((item) => {
          const Icon = item.icon

          return (
            <button
              key={item.label}
              className={`flex w-full items-center gap-3 rounded-[8px] px-3 py-2.5 text-left text-sm font-bold transition ${
                activeSection === item.label ? "bg-[#eef1ff] text-[#6174f8]" : "text-[#555866] hover:bg-[#f7f8fc] hover:text-[#17171f]"
              }`}
              type="button"
              onClick={() => goTo(item.label)}
            >
              <Icon className="size-4" aria-hidden="true" />
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="border-t border-[#eceef5] p-4">
        <div className="rounded-[8px] bg-[#151525] p-4 text-white">
          <p className="text-xs font-black uppercase text-[#aeb8ff]">Creator workflow</p>
          <p className="mt-2 text-sm font-bold leading-5 text-white/86">Apply, wait for acceptance, work only after escrow, then submit and get paid.</p>
        </div>
      </div>
    </aside>
  )

  return (
    <main className="min-h-screen bg-[#f7f8fb] font-[Arial,Helvetica,sans-serif] text-[#17171f]">
      <div className="flex min-h-screen">
        <div className="hidden w-[260px] shrink-0 border-r border-[#e7e9f2] lg:block">{shell}</div>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button className="absolute inset-0 bg-black/32" type="button" aria-label="Close menu" onClick={() => setMobileMenuOpen(false)} />
            <div className="relative h-full w-[min(320px,88vw)] shadow-2xl">{shell}</div>
          </div>
        )}

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b border-[#e7e9f2] bg-white/92 backdrop-blur-xl">
            <div className="flex h-16 items-center justify-between gap-3 px-4 lg:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <button className="grid size-10 place-items-center rounded-[8px] border border-[#e1e4ef] bg-white lg:hidden" type="button" aria-label="Open mobile menu" onClick={() => setMobileMenuOpen(true)}>
                  <Menu className="size-5" aria-hidden="true" />
                </button>
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase text-[#6174f8]">Creator workspace</p>
                  <h1 className="truncate text-2xl font-black">{activeSection}</h1>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="grid size-10 place-items-center rounded-[8px] border border-[#e1e4ef] bg-white" type="button" aria-label="Notifications" onClick={() => setNotificationOpen((open) => !open)}>
                  <Bell className="size-4" aria-hidden="true" />
                </button>
                <button className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-[#6174f8] px-4 text-sm font-black text-white shadow-[0_10px_20px_rgba(76,91,210,0.24)]" type="button" onClick={() => setActiveSection("Find Campaigns")}>
                  <Search className="size-4" aria-hidden="true" />
                  Find campaigns
                </button>
              </div>
            </div>
          </header>

          <div className="px-4 py-5 lg:px-6">
            {activeSection === "Dashboard" && (
              <div className="space-y-5">
                <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
                  <div className="overflow-hidden rounded-[8px] border border-[#dfe3f2] bg-white shadow-sm">
                    <div className="grid gap-5 bg-[#111322] p-5 text-white lg:grid-cols-[1fr_280px]">
                      <div>
                        <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-black text-[#b9c3ff]">
                          <Sparkles className="size-4" aria-hidden="true" />
                          Creator command center
                        </p>
                        <h2 className="mt-4 max-w-2xl text-3xl font-black tracking-normal">Manage brand deals from application to payout</h2>
                        <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-white/72">
                          Discover matching campaigns, track application states, collaborate after escrow, submit deliverables, and watch payouts in one workspace.
                        </p>
                        <div className="mt-5 flex flex-wrap gap-2">
                          <Button className="h-10 rounded-[8px] bg-[#7894ff] px-4 text-sm font-black text-white hover:bg-[#6f86f4]" type="button" onClick={() => setActiveSection("Find Campaigns")}>
                            Browse campaigns <ArrowRight className="size-4" aria-hidden="true" />
                          </Button>
                          <Button className="h-10 rounded-[8px] border-white/15 bg-white/10 px-4 text-sm font-black text-white hover:bg-white/15" variant="outline" type="button" onClick={() => setActiveSection("Profile")}>
                            Edit profile <Edit3 className="size-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </div>
                      <div className="rounded-[8px] border border-white/12 bg-white/8 p-4">
                        <div className="flex items-center gap-3">
                          <div className="size-16 rounded-full bg-cover bg-center ring-4 ring-white/15" style={{ backgroundImage: `url(${creatorProfileImage})` }} />
                          <div>
                            <p className="text-lg font-black">Aarati Rai</p>
                            <p className="text-sm font-bold text-white/62">@aaratiugc</p>
                          </div>
                        </div>
                        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                          <MiniStat label="Followers" value="42K" />
                          <MiniStat label="Score" value="92" />
                          <MiniStat label="Match" value="96%" />
                        </div>
                      </div>
                    </div>
                    <div className="p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-sm font-black text-[#6174f8]">Creator home</p>
                        <h3 className="mt-2 text-xl font-black tracking-normal">Live performance snapshot</h3>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {stats.map((item) => (
                        <MetricCard key={item.label} icon={item.icon} label={item.label} value={item.value} detail={item.detail} />
                      ))}
                    </div>
                    </div>
                  </div>

                  <ActivityPanel activities={activities} />
                </section>

                <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                  <CampaignsPanel campaigns={filteredCampaigns.slice(0, 3)} search={campaignSearch} onSearch={setCampaignSearch} onApply={applyToCampaign} onWithdraw={withdrawApplication} compact />
                  <CollaborationsPanel collaborations={collaborations} onSubmit={submitDeliverable} onMarkPaid={markPaid} />
                </section>
              </div>
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
          </div>
        </section>
      </div>

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
    </main>
  )
}
