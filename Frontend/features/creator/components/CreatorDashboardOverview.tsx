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

type Section = "Dashboard" | "Find Campaigns" | "Applications" | "Collaborations" | "Messages" | "Payouts" | "Profile"
type CreatorApplicationStatus = "NOT_APPLIED" | "PENDING" | "ACCEPTED" | "REJECTED"
type CreatorCampaign = Omit<MarketplaceCampaign, "status"> & {
  campaignStatus: CampaignStatus
  match: number
  status: CreatorApplicationStatus
}
type Collaboration = MarketplaceCollaboration

type Activity = {
  id: number
  message: string
  tone: "blue" | "green" | "amber"
}

const emptySubmissionForm: Omit<DeliverableSubmission, "submittedAt"> = {
  videoUrl: "",
  postUrl: "",
  caption: "",
  notes: "",
  aspectRatio: "9:16",
  duration: "30s",
  checklist: {
    briefMatched: true,
    usageRights: true,
    noCopyrightMusic: true,
  },
}

const navItems: { label: Section; icon: typeof LayoutDashboard }[] = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Find Campaigns", icon: Search },
  { label: "Applications", icon: BriefcaseBusiness },
  { label: "Collaborations", icon: MessageSquare },
  { label: "Messages", icon: Send },
  { label: "Payouts", icon: CreditCard },
  { label: "Profile", icon: UserRound },
]

const creatorProfileImage = "https://images.unsplash.com/photo-1598550874175-4d0ef436c909?auto=format&fit=crop&w=640&q=80"

const portfolioShots = [
  {
    title: "Skincare morning reel",
    type: "Video",
    metric: "8.4% engagement",
    platform: "Instagram Reels",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=640&q=80",
  },
  {
    title: "Local cafe product story",
    type: "Video",
    metric: "31K views",
    platform: "TikTok",
    image: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=640&q=80",
  },
  {
    title: "Beauty shelf UGC",
    type: "Video",
    metric: "12 brand saves",
    platform: "YouTube Shorts",
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=640&q=80",
  },
  {
    title: "Cleanser hook test",
    type: "Video",
    metric: "4.9% CTR",
    platform: "Instagram Reels",
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=640&q=80",
  },
  {
    title: "GRWM product mention",
    type: "Video",
    metric: "18K saves",
    platform: "TikTok",
    image: "https://images.unsplash.com/photo-1487412912498-0447578fcca8?auto=format&fit=crop&w=640&q=80",
  },
]

const creatorAnalytics = [
  { label: "Engagement", value: "8.4%", detail: "Likes, comments, saves" },
  { label: "Avg views", value: "31K", detail: "Last 30 days" },
  { label: "Avg likes", value: "2.6K", detail: "Per video" },
  { label: "Reach", value: "284K", detail: "Monthly estimate" },
  { label: "Saves", value: "18K", detail: "High intent" },
  { label: "Completion", value: "71%", detail: "Video watch-through" },
]

function campaignImage(campaign: Pick<MarketplaceCampaign, "niche" | "title">) {
  const key = `${campaign.niche} ${campaign.title}`.toLowerCase()

  if (key.includes("food") || key.includes("momo")) {
    return "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=760&q=80"
  }

  if (key.includes("tea") || key.includes("lifestyle")) {
    return "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=760&q=80"
  }

  return "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=760&q=80"
}

function money(value: number) {
  return `NPR ${value.toLocaleString("en-IN")}`
}

function statusClass(status: string) {
  if (["ACCEPTED", "APPROVED", "PAID", "HELD", "RELEASED", "IN_PROGRESS"].includes(status)) {
    return "bg-[#e9f8ef] text-[#16864f]"
  }
  if (["PENDING", "ESCROW_PENDING", "SUBMITTED"].includes(status)) {
    return "bg-[#fff5df] text-[#9b6500]"
  }
  if (status === "REJECTED") {
    return "bg-[#fff0f0] text-[#b83232]"
  }
  return "bg-[#eef1ff] text-[#6070e8]"
}

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

function CampaignsPanel({
  campaigns,
  search,
  onSearch,
  onApply,
  onWithdraw,
  compact = false,
}: {
  campaigns: CreatorCampaign[]
  search: string
  onSearch: (search: string) => void
  onApply: (id: number) => void
  onWithdraw: (id: number) => void
  compact?: boolean
}) {
  return (
    <section className="rounded-[8px] border border-[#e4e7f1] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#edf0f6] p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-black">{compact ? "Recommended campaigns" : "Find Campaigns"}</h2>
          <p className="mt-1 text-sm font-medium text-[#727887]">Apply to brand campaigns that match your profile and content category.</p>
        </div>
        <label className="flex items-center gap-2 rounded-[8px] border border-[#e1e4ef] px-3 py-2 text-sm font-bold text-[#727887]">
          <Search className="size-4" aria-hidden="true" />
          <input
            className="w-full bg-transparent text-sm font-bold outline-none placeholder:text-[#727887]"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search campaign, niche, brand"
          />
        </label>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
        {campaigns.map((campaign) => (
          <article key={campaign.id} className="overflow-hidden rounded-[8px] border border-[#e7e9f2] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(43,48,79,0.12)]">
            <div className="flex items-center justify-between gap-2 border-b border-[#edf0f6] p-2.5">
              <div className="flex min-w-0 items-center gap-2">
                <div className="grid size-8 shrink-0 place-items-center rounded-full bg-[#111322] text-xs font-black text-white">
                  {campaign.brand.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-black text-[#17171f]">{campaign.brand}</h3>
                  <p className="truncate text-xs font-bold text-[#727887]">{campaign.platform} - {campaign.country}</p>
                </div>
              </div>
              <span className="rounded-full bg-[#eef1ff] px-2 py-0.5 text-[11px] font-black text-[#6174f8]">{campaign.match}%</span>
            </div>

            <div className="relative aspect-[4/3] bg-cover bg-center" style={{ backgroundImage: `url(${campaignImage(campaign)})` }}>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent p-4">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-black ${statusClass(campaign.status)}`}>{campaign.status.replace("_", " ")}</span>
                <h2 className="mt-1.5 line-clamp-2 text-base font-black leading-5 text-white">{campaign.title}</h2>
              </div>
            </div>

            <div className="p-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex gap-2">
                  <button className="grid size-8 place-items-center rounded-full border border-[#e1e4ef] text-[#17171f]" type="button" aria-label="Like campaign">
                    <Heart className="size-3.5" aria-hidden="true" />
                  </button>
                  <button className="grid size-8 place-items-center rounded-full border border-[#e1e4ef] text-[#17171f]" type="button" aria-label="Message brand">
                    <MessageSquare className="size-3.5" aria-hidden="true" />
                  </button>
                  <button className="grid size-8 place-items-center rounded-full border border-[#e1e4ef] text-[#17171f]" type="button" aria-label="Share campaign">
                    <Send className="size-3.5" aria-hidden="true" />
                  </button>
                </div>
                <p className="text-xs font-black text-[#17171f]">{money(campaign.budget)}</p>
              </div>

              <p className="mt-2 line-clamp-2 text-xs font-bold leading-5 text-[#17171f]">
                <span className="font-black">{campaign.brand}</span>{" "}
                <span className="font-medium text-[#555866]">{campaign.brief}</span>
              </p>

              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-black text-[#697080]">
                <span className="rounded-full bg-[#f3f5fb] px-2 py-0.5">{campaign.niche}</span>
                <span className="rounded-full bg-[#f3f5fb] px-2 py-0.5">{Math.round(campaign.reach / 1000)}K reach</span>
                <span className="rounded-full bg-[#f3f5fb] px-2 py-0.5">{campaign.deadline}</span>
              </div>

              <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-2">
                {campaign.status === "NOT_APPLIED" && (
                  <Button className="h-8 rounded-[8px] bg-[#6174f8] px-3 text-xs font-black text-white hover:bg-[#5268df]" type="button" onClick={() => onApply(campaign.id)}>
                    Apply now
                  </Button>
                )}
                {campaign.status === "PENDING" && (
                  <Button className="h-8 rounded-[8px] border-[#f0d89f] px-3 text-xs font-black text-[#9b6500]" variant="outline" type="button" onClick={() => onWithdraw(campaign.id)}>
                    Withdraw
                  </Button>
                )}
                {campaign.status === "ACCEPTED" && (
                  <span className="inline-flex h-8 items-center justify-center rounded-[8px] bg-[#e9f8ef] px-3 text-xs font-black text-[#16864f]">Accepted</span>
                )}
                <Button className="h-8 rounded-[8px] px-2.5 text-xs font-black text-[#555866]" variant="outline" type="button">
                  Details
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function ApplicationsPanel({ campaigns, onWithdraw }: { campaigns: CreatorCampaign[]; onWithdraw: (id: number) => void }) {
  const applications = campaigns.filter((campaign) => campaign.status !== "NOT_APPLIED")

  return (
    <section className="rounded-[8px] border border-[#e4e7f1] bg-white shadow-sm">
      <div className="border-b border-[#edf0f6] p-5">
        <h2 className="text-xl font-black">Applications</h2>
        <p className="mt-1 text-sm font-medium text-[#727887]">Track submitted, accepted, and rejected brand applications.</p>
      </div>
      <div className="grid gap-3 p-5">
        {applications.map((campaign) => (
          <article key={campaign.id} className="flex flex-col gap-3 rounded-[8px] border border-[#edf0f6] p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-black">{campaign.title}</h3>
              <p className="mt-1 text-sm font-bold text-[#727887]">{campaign.brand} - {campaign.platform}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-xs font-black ${statusClass(campaign.status)}`}>{campaign.status}</span>
              {campaign.status === "PENDING" && (
                <button className="h-9 rounded-[8px] border border-[#f0d89f] px-3 text-sm font-black text-[#9b6500]" type="button" onClick={() => onWithdraw(campaign.id)}>
                  Withdraw
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function CollaborationsPanel({
  collaborations,
  onSubmit,
  onMarkPaid,
}: {
  collaborations: Collaboration[]
  onSubmit: (id: number) => void
  onMarkPaid: (id: number) => void
}) {
  return (
    <section className="rounded-[8px] border border-[#e4e7f1] bg-white shadow-sm">
      <div className="border-b border-[#edf0f6] p-5">
        <h2 className="text-xl font-black">Collaborations</h2>
        <p className="mt-1 text-sm font-medium text-[#727887]">Chat and deliverables unlock when the brand has deposited escrow.</p>
      </div>
      <div className="grid gap-4 p-5 lg:grid-cols-2">
        {collaborations.map((collab) => (
          <article key={collab.id} className="rounded-[8px] border border-[#edf0f6] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-black">{collab.campaign}</h3>
                <p className="mt-1 text-sm font-bold text-[#697080]">{collab.brand}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-black ${statusClass(collab.state)}`}>{collab.state}</span>
            </div>
            <p className="mt-4 rounded-[8px] bg-[#f7f8fb] p-3 text-sm font-bold text-[#606675]">{collab.deliverable}</p>
            {collab.submission && (
              <div className="mt-4 rounded-[8px] border border-[#dfe4ff] bg-[#f7f8ff] p-3">
                <div className="flex items-center gap-2 text-sm font-black text-[#5268df]">
                  <PlayCircle className="size-4" aria-hidden="true" />
                  Video submitted for review
                </div>
                <p className="mt-2 text-sm font-bold leading-6 text-[#606675]">{collab.submission.caption}</p>
                <a className="mt-2 inline-flex text-sm font-black text-[#6174f8] hover:underline" href={collab.submission.videoUrl} target="_blank" rel="noreferrer">
                  Open video draft
                </a>
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {collab.state === "IN_PROGRESS" && (
                <button className="h-9 rounded-[8px] bg-[#6174f8] px-3 text-sm font-black text-white" type="button" onClick={() => onSubmit(collab.id)}>
                  Submit video
                </button>
              )}
              {collab.state === "SUBMITTED" && (
                <button className="h-9 rounded-[8px] bg-[#16864f] px-3 text-sm font-black text-white" type="button" onClick={() => onMarkPaid(collab.id)}>
                  Simulate payout
                </button>
              )}
              {collab.escrow === "PENDING" && (
                <span className="inline-flex h-9 items-center rounded-[8px] bg-[#fff5df] px-3 text-sm font-black text-[#9b6500]">Escrow pending</span>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function DeliverableSubmissionModal({
  collab,
  form,
  onChange,
  onClose,
  onSubmit,
}: {
  collab: Collaboration
  form: Omit<DeliverableSubmission, "submittedAt">
  onChange: (form: Omit<DeliverableSubmission, "submittedAt">) => void
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4 py-6">
      <form className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[8px] bg-white shadow-[0_24px_70px_rgba(20,21,34,0.28)]" onSubmit={onSubmit}>
        <div className="flex items-start justify-between gap-4 border-b border-[#edf0f6] p-5">
          <div>
            <p className="text-xs font-black uppercase text-[#6174f8]">Creator deliverable</p>
            <h2 className="mt-1 text-2xl font-black">Submit campaign video</h2>
            <p className="mt-1 text-sm font-medium text-[#727887]">{collab.campaign} - {collab.brand}</p>
          </div>
          <button className="grid size-9 place-items-center rounded-full bg-[#f3f5fb]" type="button" aria-label="Close submission form" onClick={onClose}>
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <SubmissionField label="Video draft URL" required>
              <input className="input" required type="url" value={form.videoUrl} onChange={(event) => onChange({ ...form, videoUrl: event.target.value })} placeholder="https://youtube.com/shorts/... or https://drive.google.com/..." />
            </SubmissionField>
            <SubmissionField label="Published post URL">
              <input className="input" type="url" value={form.postUrl} onChange={(event) => onChange({ ...form, postUrl: event.target.value })} placeholder="Instagram/TikTok post link after publishing" />
            </SubmissionField>
            <div className="grid gap-4 sm:grid-cols-2">
              <SubmissionField label="Aspect ratio">
                <select className="input" value={form.aspectRatio} onChange={(event) => onChange({ ...form, aspectRatio: event.target.value })}>
                  <option>9:16</option>
                  <option>1:1</option>
                  <option>16:9</option>
                </select>
              </SubmissionField>
              <SubmissionField label="Duration">
                <select className="input" value={form.duration} onChange={(event) => onChange({ ...form, duration: event.target.value })}>
                  <option>15s</option>
                  <option>30s</option>
                  <option>45s</option>
                  <option>60s</option>
                </select>
              </SubmissionField>
            </div>
            <SubmissionField label="Caption">
              <textarea className="input min-h-24 resize-none py-3" value={form.caption} onChange={(event) => onChange({ ...form, caption: event.target.value })} placeholder="Write the campaign caption or hook used in the video." />
            </SubmissionField>
            <SubmissionField label="Notes for brand">
              <textarea className="input min-h-24 resize-none py-3" value={form.notes} onChange={(event) => onChange({ ...form, notes: event.target.value })} placeholder="Mention changes, timing, product shots, CTA, or questions." />
            </SubmissionField>
          </div>

          <aside className="rounded-[8px] border border-[#edf0f6] bg-[#fbfcff] p-4">
            <div className="grid min-h-44 place-items-center rounded-[8px] bg-[#111322] text-center text-white">
              <div>
                <PlayCircle className="mx-auto size-10 text-[#9fb0ff]" aria-hidden="true" />
                <p className="mt-3 text-sm font-black">Video review preview</p>
                <p className="mt-1 px-6 text-xs font-bold text-white/62">Brand opens the draft URL from review queue.</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {[
                ["briefMatched", "Video matches campaign brief"],
                ["usageRights", "Brand can use this content"],
                ["noCopyrightMusic", "No copyrighted music"],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-3 rounded-[8px] bg-white p-3 text-sm font-bold text-[#555866]">
                  <input
                    className="size-4 accent-[#6174f8]"
                    type="checkbox"
                    checked={form.checklist[key as keyof typeof form.checklist]}
                    onChange={(event) =>
                      onChange({
                        ...form,
                        checklist: { ...form.checklist, [key]: event.target.checked },
                      })
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          </aside>
        </div>

        <div className="flex justify-end gap-3 border-t border-[#edf0f6] p-5">
          <Button className="h-10 rounded-[8px] px-4 text-sm font-black" variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button className="h-10 rounded-[8px] bg-[#6174f8] px-4 text-sm font-black text-white hover:bg-[#5268df]" type="submit">
            Submit for brand review
          </Button>
        </div>
      </form>
    </div>
  )
}

function SubmissionField({ label, children, required = false }: { label: string; children: ReactNode; required?: boolean }) {
  return (
    <label className="text-sm font-black text-[#484b57]">
      {label} {required && <span className="text-[#b83232]">*</span>}
      <div className="mt-2 [&_.input]:h-11 [&_.input]:w-full [&_.input]:rounded-[8px] [&_.input]:border [&_.input]:border-[#dfe3ee] [&_.input]:bg-white [&_.input]:px-3 [&_.input]:text-sm [&_.input]:font-bold [&_.input]:outline-none [&_.input]:transition [&_.input]:focus:border-[#6174f8] [&_.input]:focus:ring-4 [&_.input]:focus:ring-[#6174f8]/10">
        {children}
      </div>
    </label>
  )
}

function MessagesPanel({
  collaborations,
  messages,
  selectedRoomId,
  message,
  onMessageChange,
  onRoomChange,
  onSend,
}: {
  collaborations: Collaboration[]
  messages: ReturnType<typeof useMarketplaceStore>["messages"]
  selectedRoomId: number
  message: string
  onMessageChange: (message: string) => void
  onRoomChange: (roomId: number) => void
  onSend: () => void
}) {
  const activeRoom = collaborations.find((collab) => collab.id === selectedRoomId) ?? collaborations[0]
  const roomMessages = messages.filter((item) => item.roomId === activeRoom?.id)

  return (
    <section className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <div className="rounded-[8px] border border-[#e4e7f1] bg-white p-4 shadow-sm">
        {collaborations.map((collab) => (
          <button key={collab.id} className={`mb-2 flex w-full items-center gap-3 rounded-[8px] p-3 text-left ${activeRoom?.id === collab.id ? "bg-[#eef1ff]" : "hover:bg-[#f7f8fb]"}`} type="button" onClick={() => onRoomChange(collab.id)}>
            <span className="grid size-10 place-items-center rounded-full bg-[#6174f8] text-sm font-black text-white">{collab.brand.charAt(0)}</span>
            <span>
              <span className="block text-sm font-black">{collab.brand}</span>
              <span className="block text-xs font-bold text-[#8a909f]">{collab.campaign}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="rounded-[8px] border border-[#e4e7f1] bg-white shadow-sm">
        <div className="border-b border-[#edf0f6] p-5">
          <h2 className="text-xl font-black">{activeRoom?.brand ?? "Messages"}</h2>
          <p className="mt-1 text-sm font-medium text-[#727887]">{activeRoom?.escrow === "HELD" ? "Chat is unlocked because escrow is held." : "Chat unlocks when escrow is deposited."}</p>
        </div>
        <div className="min-h-[320px] space-y-3 p-5">
          {roomMessages.map((item) => (
            <div key={item.id} className={item.sender === "creator" ? "ml-auto max-w-md" : "max-w-md"}>
              <p className="mb-1 text-xs font-black text-[#8a909f]">{item.senderName}</p>
              <p className={`rounded-[8px] p-3 text-sm font-bold ${item.sender === "creator" ? "bg-[#6174f8] text-white" : "bg-[#f3f5fb] text-[#555866]"}`}>
                {item.body}
              </p>
            </div>
          ))}
          {roomMessages.length === 0 && (
            <p className="rounded-[8px] border border-dashed border-[#dfe3ee] p-4 text-sm font-bold text-[#727887]">No messages yet. Start the room with a campaign update.</p>
          )}
        </div>
        <div className="flex gap-2 border-t border-[#edf0f6] p-4">
          <input
            className="h-10 flex-1 rounded-[8px] border border-[#e1e4ef] px-3 text-sm font-bold outline-none focus:border-[#6174f8]"
            placeholder="Type a message..."
            value={message}
            onChange={(event) => onMessageChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onSend()
            }}
          />
          <button className="grid size-10 place-items-center rounded-[8px] bg-[#6174f8] text-white" type="button" aria-label="Send message" onClick={onSend}>
            <Send className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  )
}

function PayoutsPanel({
  collaborations,
  onSubmit,
  onMarkPaid,
}: {
  collaborations: Collaboration[]
  onSubmit: (id: number) => void
  onMarkPaid: (id: number) => void
}) {
  const escrowHeld = collaborations.filter((item) => item.escrow === "HELD").reduce((sum, item) => sum + item.payout, 0)
  const released = collaborations.filter((item) => item.escrow === "RELEASED").reduce((sum, item) => sum + item.payout, 0)

  return (
    <section className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard icon={WalletCards} label="Escrow held" value={money(escrowHeld)} detail="Protected by brand deposit" />
        <MetricCard icon={IndianRupee} label="Released" value={money(released)} detail="Available after approval" />
        <MetricCard icon={Clock3} label="Pending brand escrow" value={collaborations.filter((item) => item.escrow === "PENDING").length.toString()} detail="Chat locked until deposit" />
      </div>
      <CollaborationsPanel collaborations={collaborations} onSubmit={onSubmit} onMarkPaid={onMarkPaid} />
    </section>
  )
}

function ProfilePanel() {
  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_380px]">
      <div className="overflow-hidden rounded-[8px] border border-[#e4e7f1] bg-white shadow-sm">
        <div className="relative min-h-56 bg-[#111322] p-5 text-white">
          <div className="absolute inset-0 bg-cover bg-center opacity-35" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1400&q=80)" }} />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="flex items-end gap-4">
              <div className="relative">
                <div className="size-28 rounded-[8px] bg-cover bg-center shadow-[0_18px_50px_rgba(0,0,0,0.25)] ring-4 ring-white/18" style={{ backgroundImage: `url(${creatorProfileImage})` }} />
                <button className="absolute -bottom-2 -right-2 grid size-9 place-items-center rounded-full bg-[#7894ff] text-white shadow-lg" type="button" aria-label="Change profile photo">
                  <Camera className="size-4" aria-hidden="true" />
                </button>
              </div>
              <div>
                <p className="inline-flex items-center gap-1 rounded-full bg-white/12 px-3 py-1 text-xs font-black text-[#c9d1ff]">
                  <BadgeCheck className="size-3.5" aria-hidden="true" />
                  Verified creator
                </p>
                <h2 className="mt-3 text-3xl font-black">Aarati Rai</h2>
                <p className="mt-1 text-sm font-bold text-white/70">@aaratiugc - Beauty UGC - Kathmandu</p>
              </div>
            </div>
            <Button className="h-10 rounded-[8px] bg-white px-4 text-sm font-black text-[#17171f] hover:bg-white/90" type="button">
              <Edit3 className="size-4" aria-hidden="true" />
              Edit profile
            </Button>
          </div>
        </div>

        <div className="p-5">
          <div className="flex flex-wrap gap-2">
            {["Instagram Reels", "TikTok", "Beauty", "Skincare", "Kathmandu"].map((tag) => (
              <span key={tag} className="rounded-full bg-[#eef1ff] px-3 py-1 text-xs font-black text-[#6174f8]">{tag}</span>
            ))}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            <div className="rounded-[8px] border border-[#edf0f6] p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-black">Editable profile details</h3>
                <SlidersHorizontal className="size-4 text-[#6174f8]" aria-hidden="true" />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field label="Display name" value="Aarati Rai" />
                <Field label="Handle" value="@aaratiugc" />
                <Field label="Category" value="Beauty UGC" />
                <Field label="Location" value="Kathmandu, Nepal" />
              </div>
              <label className="mt-3 block text-sm font-black text-[#484b57]">
                Bio
                <textarea className="mt-2 min-h-24 w-full resize-none rounded-[8px] border border-[#dfe3ee] px-3 py-3 text-sm font-bold leading-6 outline-none focus:border-[#6174f8] focus:ring-4 focus:ring-[#6174f8]/10" defaultValue="I create clean, conversion-focused beauty reels, skincare explainers, and local lifestyle UGC for brands entering Nepal." />
              </label>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button className="h-9 rounded-[8px] bg-[#6174f8] px-4 text-sm font-black text-white hover:bg-[#5268df]" type="button">Save changes</Button>
                <Button className="h-9 rounded-[8px] px-4 text-sm font-black" variant="outline" type="button">Preview public profile</Button>
              </div>
            </div>

            <div className="rounded-[8px] border border-[#edf0f6] p-4">
              <h3 className="text-lg font-black">Media kit</h3>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <MiniStat label="Followers" value="42K" />
                <MiniStat label="Avg views" value="31K" />
                <MiniStat label="Rating" value="4.9" />
              </div>
              <div className="mt-4 space-y-3 text-sm font-bold text-[#555866]">
                <p className="flex items-center gap-2 rounded-[8px] bg-[#f7f8fb] p-3"><Eye className="size-4 text-[#6174f8]" /> 284K estimated campaign reach</p>
                <p className="flex items-center gap-2 rounded-[8px] bg-[#f7f8fb] p-3"><Heart className="size-4 text-[#d94b75]" /> Beauty audience strength</p>
                <p className="flex items-center gap-2 rounded-[8px] bg-[#f7f8fb] p-3"><Star className="size-4 fill-[#f7b733] text-[#f7b733]" /> Brand response under 12h</p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[8px] border border-[#edf0f6] p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-lg font-black">Profile analytics</h3>
                <p className="mt-1 text-sm font-bold text-[#727887]">Metrics brands can review before accepting a collaboration.</p>
              </div>
              <span className="rounded-full bg-[#e9f8ef] px-3 py-1 text-xs font-black text-[#16864f]">Visible to brands</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              {creatorAnalytics.map((item) => (
                <div key={item.label} className="rounded-[8px] bg-[#fbfcff] p-3">
                  <p className="text-xs font-black uppercase text-[#8a909f]">{item.label}</p>
                  <p className="mt-2 text-2xl font-black">{item.value}</p>
                  <p className="mt-1 text-xs font-bold text-[#727887]">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black">Featured work</h3>
                <p className="mt-1 text-sm font-bold text-[#727887]">Videos posted on Nepfluence for brands to review.</p>
              </div>
              <Button className="h-9 rounded-[8px] px-3 text-sm font-black" variant="outline" type="button">
                <Upload className="size-4" aria-hidden="true" />
                Add video
              </Button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {portfolioShots.map((shot) => (
                <article key={shot.title} className="overflow-hidden rounded-[8px] border border-[#edf0f6]">
                  <div className="relative h-40 bg-cover bg-center" style={{ backgroundImage: `url(${shot.image})` }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-1 text-[11px] font-black text-[#26233d]">{shot.type}</span>
                    <span className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-black/45 text-white backdrop-blur">
                      <PlayCircle className="size-4" aria-hidden="true" />
                    </span>
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-xs font-black text-white">{shot.platform}</p>
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="text-sm font-black">{shot.title}</h4>
                    <p className="mt-1 text-xs font-bold text-[#727887]">{shot.metric}</p>
                  </div>
                </article>
              ))}
            <div className="mt-3 flex flex-wrap gap-2">
            </div>
          </div>
        </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="rounded-[8px] border border-[#e4e7f1] bg-white p-5 shadow-sm">
          <h3 className="text-xl font-black">Creator score</h3>
          <div className="mt-5 grid place-items-center rounded-[8px] bg-[#111322] p-6 text-white">
            <div className="text-5xl font-black text-[#9fb0ff]">92</div>
            <p className="mt-2 text-sm font-bold text-white/68">Strong marketplace readiness</p>
          </div>
          <div className="mt-4 space-y-3 text-sm font-bold text-[#555866]">
            <p className="rounded-[8px] bg-[#f7f8fb] p-3">Complete payout verification.</p>
            <p className="rounded-[8px] bg-[#f7f8fb] p-3">Add three recent content samples.</p>
            <p className="rounded-[8px] bg-[#f7f8fb] p-3">Keep response time under 24 hours.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <InfoCard icon={BadgeCheck} title="Verified creator" body="Profile review, handle ownership, and payout details are ready for backend verification." />
          <InfoCard icon={Upload} title="Portfolio assets" body="Use this space for past reels, content samples, and campaign proof once uploads are connected." />
          <InfoCard icon={Sparkles} title="Match profile" body="Beauty UGC, food reactions, Kathmandu reach, and short-form video are included in campaign matching." />
          <InfoCard icon={FileText} title="Creator terms" body="Brief lock, revision rules, escrow, and payout release can map to the collaboration contract." />
        </div>
      </div>
    </section>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="text-sm font-black text-[#484b57]">
      {label}
      <input className="mt-2 h-10 w-full rounded-[8px] border border-[#dfe3ee] px-3 text-sm font-bold outline-none focus:border-[#6174f8] focus:ring-4 focus:ring-[#6174f8]/10" defaultValue={value} />
    </label>
  )
}

function ActivityPanel({ activities }: { activities: Activity[] }) {
  return (
    <section className="rounded-[8px] border border-[#e4e7f1] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">Activity</h2>
          <p className="mt-1 text-sm font-medium text-[#727887]">Updates from creator actions.</p>
        </div>
        <span className="rounded-full bg-[#eef1ff] px-3 py-1 text-xs font-black text-[#6174f8]">Live UI</span>
      </div>
      <div className="mt-5 space-y-3">
        {activities.map((activity) => (
          <div key={activity.id} className="flex gap-3">
            <span className={`mt-1 size-2.5 shrink-0 rounded-full ${activity.tone === "green" ? "bg-[#1f9f68]" : activity.tone === "amber" ? "bg-[#e5a122]" : "bg-[#6174f8]"}`} />
            <p className="text-sm font-bold leading-6 text-[#555866]">{activity.message}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function NotificationPanel({ activities, onClose }: { activities: Activity[]; onClose: () => void }) {
  return (
    <section className="fixed right-5 top-20 z-50 w-[min(380px,calc(100vw-2rem))] rounded-[8px] border border-[#e4e7f1] bg-white shadow-[0_18px_50px_rgba(25,28,50,0.2)]">
      <div className="flex items-start justify-between gap-3 border-b border-[#edf0f6] p-4">
        <div>
          <p className="text-xs font-black uppercase text-[#6174f8]">Notifications</p>
          <h2 className="text-lg font-black">Creator updates</h2>
        </div>
        <button className="grid size-8 place-items-center rounded-full bg-[#f3f5fb]" type="button" aria-label="Close notifications" onClick={onClose}>
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="space-y-3 p-4">
        {activities.map((activity) => (
          <p key={activity.id} className="rounded-[8px] bg-[#f7f8fb] p-3 text-sm font-bold leading-6 text-[#606675]">
            {activity.message}
          </p>
        ))}
      </div>
    </section>
  )
}

function MetricCard({ icon: Icon, label, value, detail }: { icon: typeof LayoutDashboard; label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[8px] border border-[#e4e7f1] bg-white p-5 shadow-sm">
      <span className="grid size-10 place-items-center rounded-[8px] bg-[#eef1ff] text-[#6174f8]">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="mt-4 text-3xl font-black">{value}</div>
      <div className="mt-1 text-sm font-black text-[#484b57]">{label}</div>
      <div className="mt-1 text-xs font-bold text-[#8a909f]">{detail}</div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] bg-[#f7f8fb] p-3">
      <div className="text-xs font-bold text-[#8a909f]">{label}</div>
      <div className="mt-1 text-sm font-black text-[#484b57]">{value}</div>
    </div>
  )
}

function InfoCard({ icon: Icon, title, body }: { icon: typeof LayoutDashboard; title: string; body: ReactNode }) {
  return (
    <div className="rounded-[8px] border border-[#edf0f6] p-4">
      <span className="grid size-9 place-items-center rounded-[8px] bg-[#eef1ff] text-[#6174f8]">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <h3 className="mt-4 font-black">{title}</h3>
      <p className="mt-2 text-sm font-bold leading-6 text-[#606675]">{body}</p>
    </div>
  )
}
