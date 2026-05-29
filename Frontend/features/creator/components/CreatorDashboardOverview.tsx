"use client"

import Link from "next/link"
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  IndianRupee,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRound,
  WalletCards,
  X,
} from "lucide-react"
import { ReactNode, useMemo, useState } from "react"
import {
  CampaignStatus,
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

const navItems: { label: Section; icon: typeof LayoutDashboard }[] = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Find Campaigns", icon: Search },
  { label: "Applications", icon: BriefcaseBusiness },
  { label: "Collaborations", icon: MessageSquare },
  { label: "Messages", icon: Send },
  { label: "Payouts", icon: CreditCard },
  { label: "Profile", icon: UserRound },
]

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
    marketplace.markSubmitted(id)
    addActivity("Deliverable submitted for brand review.", "blue")
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

    setCreatorMessage("")
    addActivity(`Message sent to Trail Tea: ${message}`, "blue")
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
                  <div className="rounded-[8px] border border-[#e4e7f1] bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-sm font-black text-[#6174f8]">Creator home</p>
                        <h2 className="mt-2 text-3xl font-black tracking-normal">Manage brand deals from application to payout</h2>
                        <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-[#666b7a]">
                          Discover matching campaigns, track application states, collaborate after escrow, submit deliverables, and watch payouts in one workspace.
                        </p>
                      </div>
                      <button className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[8px] bg-[#17171f] px-4 text-sm font-black text-white" type="button" onClick={() => setActiveSection("Find Campaigns")}>
                        Browse campaigns <ArrowRight className="size-4" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {stats.map((item) => (
                        <MetricCard key={item.label} icon={item.icon} label={item.label} value={item.value} detail={item.detail} />
                      ))}
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
            {activeSection === "Messages" && <MessagesPanel message={creatorMessage} onMessageChange={setCreatorMessage} onSend={sendCreatorMessage} />}
            {activeSection === "Payouts" && <PayoutsPanel collaborations={collaborations} onSubmit={submitDeliverable} onMarkPaid={markPaid} />}
            {activeSection === "Profile" && <ProfilePanel />}
          </div>
        </section>
      </div>

      {notificationOpen && <NotificationPanel activities={activities} onClose={() => setNotificationOpen(false)} />}
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

      <div className="grid gap-4 p-5 lg:grid-cols-2">
        {campaigns.map((campaign) => (
          <article key={campaign.id} className="rounded-[8px] border border-[#edf0f6] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase text-[#6174f8]">{campaign.brand}</p>
                <h3 className="mt-1 text-lg font-black">{campaign.title}</h3>
                <p className="mt-1 text-sm font-bold text-[#727887]">{campaign.niche} - {campaign.platform}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-black ${statusClass(campaign.status)}`}>{campaign.status.replace("_", " ")}</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
              <MiniStat label="Budget" value={money(campaign.budget)} />
              <MiniStat label="Match" value={`${campaign.match}%`} />
              <MiniStat label="Deadline" value={campaign.deadline} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {campaign.status === "NOT_APPLIED" && (
                <button className="h-9 rounded-[8px] bg-[#6174f8] px-3 text-sm font-black text-white" type="button" onClick={() => onApply(campaign.id)}>
                  Apply now
                </button>
              )}
              {campaign.status === "PENDING" && (
                <button className="h-9 rounded-[8px] border border-[#f0d89f] px-3 text-sm font-black text-[#9b6500]" type="button" onClick={() => onWithdraw(campaign.id)}>
                  Withdraw
                </button>
              )}
              {campaign.status === "ACCEPTED" && (
                <span className="inline-flex h-9 items-center rounded-[8px] bg-[#e9f8ef] px-3 text-sm font-black text-[#16864f]">Accepted</span>
              )}
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
            <div className="mt-4 flex flex-wrap gap-2">
              {collab.state === "IN_PROGRESS" && (
                <button className="h-9 rounded-[8px] bg-[#6174f8] px-3 text-sm font-black text-white" type="button" onClick={() => onSubmit(collab.id)}>
                  Submit deliverable
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

function MessagesPanel({
  message,
  onMessageChange,
  onSend,
}: {
  message: string
  onMessageChange: (message: string) => void
  onSend: () => void
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <div className="rounded-[8px] border border-[#e4e7f1] bg-white p-4 shadow-sm">
        {["Trail Tea", "8848 Momo House", "Himal Glow"].map((name, index) => (
          <button key={name} className={`mb-2 flex w-full items-center gap-3 rounded-[8px] p-3 text-left ${index === 0 ? "bg-[#eef1ff]" : "hover:bg-[#f7f8fb]"}`} type="button">
            <span className="grid size-10 place-items-center rounded-full bg-[#6174f8] text-sm font-black text-white">{name.charAt(0)}</span>
            <span>
              <span className="block text-sm font-black">{name}</span>
              <span className="block text-xs font-bold text-[#8a909f]">Collaboration room</span>
            </span>
          </button>
        ))}
      </div>
      <div className="rounded-[8px] border border-[#e4e7f1] bg-white shadow-sm">
        <div className="border-b border-[#edf0f6] p-5">
          <h2 className="text-xl font-black">Trail Tea</h2>
          <p className="mt-1 text-sm font-medium text-[#727887]">Chat is unlocked because escrow is held.</p>
        </div>
        <div className="space-y-3 p-5">
          <p className="max-w-md rounded-[8px] bg-[#f3f5fb] p-3 text-sm font-bold text-[#555866]">Please submit the first story draft by Friday.</p>
          <p className="ml-auto max-w-md rounded-[8px] bg-[#6174f8] p-3 text-sm font-bold text-white">I will upload the first draft tomorrow evening.</p>
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
    <section className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <div className="rounded-[8px] border border-[#e4e7f1] bg-white p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <span className="grid size-16 place-items-center rounded-full bg-[#6174f8] text-2xl font-black text-white">A</span>
          <div>
            <h2 className="text-2xl font-black">Aarati Rai</h2>
            <p className="mt-1 text-sm font-bold text-[#727887]">@aaratiugc - Beauty UGC - Kathmandu</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Instagram Reels", "TikTok", "Beauty", "Skincare"].map((tag) => (
                <span key={tag} className="rounded-full bg-[#eef1ff] px-3 py-1 text-xs font-black text-[#6174f8]">{tag}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <InfoCard icon={BadgeCheck} title="Verified creator" body="Profile review, handle ownership, and payout details are ready for backend verification." />
          <InfoCard icon={Upload} title="Portfolio assets" body="Use this space for past reels, content samples, and campaign proof once uploads are connected." />
          <InfoCard icon={Sparkles} title="Match profile" body="Beauty UGC, food reactions, Kathmandu reach, and short-form video are included in campaign matching." />
          <InfoCard icon={FileText} title="Creator terms" body="Brief lock, revision rules, escrow, and payout release can map to the collaboration contract." />
        </div>
      </div>
      <div className="rounded-[8px] border border-[#e4e7f1] bg-white p-5 shadow-sm">
        <h3 className="text-xl font-black">Creator score</h3>
        <div className="mt-5 grid place-items-center rounded-[8px] bg-[#f7f8fb] p-6">
          <div className="text-5xl font-black text-[#6174f8]">92</div>
          <p className="mt-2 text-sm font-bold text-[#727887]">Strong marketplace readiness</p>
        </div>
        <div className="mt-4 space-y-3 text-sm font-bold text-[#555866]">
          <p className="rounded-[8px] bg-[#f7f8fb] p-3">Complete payout verification.</p>
          <p className="rounded-[8px] bg-[#f7f8fb] p-3">Add three recent content samples.</p>
          <p className="rounded-[8px] bg-[#f7f8fb] p-3">Keep response time under 24 hours.</p>
        </div>
      </div>
    </section>
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
