"use client"

import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Bell,
  Boxes,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  CreditCard,
  FileText,
  IndianRupee,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Megaphone,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Star,
  Upload,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react"
import { FormEvent, ReactNode, useMemo, useState } from "react"
import {
  MarketplaceApplication as Application,
  MarketplaceCampaign as Campaign,
  MarketplaceCollaboration as Collaboration,
  ApplicationStatus,
  useMarketplaceStore,
} from "@/features/shared/marketplaceStore"

type Section =
  | "Dashboard"
  | "Campaigns"
  | "Applications"
  | "Collaborations"
  | "Messages"
  | "Discover Creators"
  | "Payments"
  | "Trust & Reports"

type Activity = {
  id: number
  message: string
  tone: "blue" | "green" | "amber" | "red"
}

const navItems: { label: Section; icon: typeof LayoutDashboard }[] = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Campaigns", icon: Megaphone },
  { label: "Applications", icon: ClipboardList },
  { label: "Collaborations", icon: Boxes },
  { label: "Messages", icon: MessageSquare },
  { label: "Discover Creators", icon: UsersRound },
  { label: "Payments", icon: CreditCard },
  { label: "Trust & Reports", icon: FileText },
]

const creators = [
  {
    name: "Aarati Rai",
    handle: "@aaratiugc",
    country: "NP",
    niche: "Beauty UGC",
    followers: "42K",
    rating: "4.9",
    image: "https://images.unsplash.com/photo-1598550874175-4d0ef436c909?auto=format&fit=crop&w=320&q=80",
  },
  {
    name: "Nischal Gurung",
    handle: "@trailnischal",
    country: "NP",
    niche: "Travel reels",
    followers: "35K",
    rating: "4.8",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=320&q=80",
  },
  {
    name: "Sanya Mehta",
    handle: "@sanyastyle",
    country: "IN",
    niche: "Fashion",
    followers: "88K",
    rating: "4.7",
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=320&q=80",
  },
  {
    name: "Pratik Lama",
    handle: "@momoreels",
    country: "NP",
    niche: "Food",
    followers: "27K",
    rating: "4.8",
    image: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=320&q=80",
  },
  {
    name: "Kabir Rao",
    handle: "@kabircreates",
    country: "IN",
    niche: "Lifestyle",
    followers: "103K",
    rating: "4.6",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=320&q=80",
  },
]

type Creator = (typeof creators)[number]

const initialCampaigns: Campaign[] = [
  {
    id: 1,
    brand: "Himal Glow",
    title: "Himal Glow winter launch",
    niche: "Beauty",
    budget: 120000,
    country: "NP",
    platform: "Instagram Reels",
    status: "OPEN",
    applications: 18,
    accepted: 2,
    reach: 284000,
    deadline: "2026-06-12",
    brief: "Short UGC videos for a skincare launch with local creator voiceover.",
  },
  {
    id: 2,
    brand: "8848 Momo House",
    title: "8848 Momo House reels",
    niche: "Food",
    budget: 78000,
    country: "NP",
    platform: "TikTok",
    status: "DRAFT",
    applications: 0,
    accepted: 0,
    reach: 0,
    deadline: "2026-06-18",
    brief: "Creator visit and food reaction reels for new menu.",
  },
  {
    id: 3,
    brand: "Trail Tea",
    title: "Trail Tea creator stories",
    niche: "Lifestyle",
    budget: 95000,
    country: "IN",
    platform: "Instagram Stories",
    status: "PAUSED",
    applications: 9,
    accepted: 1,
    reach: 124000,
    deadline: "2026-06-22",
    brief: "Lifestyle story campaign for tea bundles.",
  },
]

const initialApplications: Application[] = [
  {
    id: 1,
    creator: "Aarati Rai",
    handle: "@aaratiugc",
    country: "NP",
    niche: "Beauty UGC",
    followers: "42K",
    match: 96,
    status: "PENDING",
    campaignId: 1,
  },
  {
    id: 2,
    creator: "Mira Shrestha",
    handle: "@miraskin",
    country: "NP",
    niche: "Skincare",
    followers: "31K",
    match: 91,
    status: "PENDING",
    campaignId: 1,
  },
  {
    id: 3,
    creator: "Kabir Rao",
    handle: "@kabircreates",
    country: "IN",
    niche: "Lifestyle",
    followers: "103K",
    match: 84,
    status: "PENDING",
    campaignId: 3,
  },
]

const initialCollaborations: Collaboration[] = [
  {
    id: 1,
    campaign: "Himal Glow winter launch",
    campaignId: 1,
    brand: "Himal Glow",
    creator: "Sujata KC",
    state: "IN_PROGRESS",
    escrow: "HELD",
    deliverable: "First draft due in 2 days",
    payout: 45000,
  },
  {
    id: 2,
    campaign: "Trail Tea creator stories",
    campaignId: 3,
    brand: "Trail Tea",
    creator: "Kabir Rao",
    state: "ESCROW_PENDING",
    escrow: "PENDING",
    deliverable: "Chat locked until escrow deposit",
    payout: 35000,
  },
]

const lifecycleSteps = [
  "Create campaign as DRAFT",
  "Publish campaign as OPEN",
  "Influencers apply in PENDING state",
  "Accept creator and lock campaign brief",
  "Deposit escrow to unlock chat",
  "Review deliverables and request revision if needed",
  "Approve work and release payment",
]

const emptyCampaignForm = {
  title: "",
  niche: "Beauty",
  budget: "50000",
  country: "NP" as "NP" | "IN",
  platform: "Instagram Reels",
  deadline: "",
  brief: "",
}

function money(value: number) {
  return `NPR ${value.toLocaleString("en-IN")}`
}

function statusClass(status: string) {
  if (["OPEN", "HELD", "IN_PROGRESS", "ACCEPTED", "APPROVED", "RELEASED"].includes(status)) {
    return "bg-[#e9f8ef] text-[#16864f]"
  }
  if (["DRAFT", "PENDING", "ESCROW_PENDING", "SUBMITTED"].includes(status)) {
    return "bg-[#fff5df] text-[#9b6500]"
  }
  if (["PAUSED", "REJECTED"].includes(status)) {
    return "bg-[#fff0f0] text-[#b83232]"
  }
  return "bg-[#eef1ff] text-[#6070e8]"
}

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

  function markSubmitted(id: number) {
    marketplace.markSubmitted(id)
    addActivity("Creator submitted a deliverable for review.", "blue")
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

    setBrandMessage("")
    addActivity(`Message sent to Sujata KC: ${message}`, "blue")
  }

  const shell = (
    <aside className="flex h-full flex-col bg-white">
      <Link href="/" className="flex h-16 items-center gap-3 border-b border-[#eceef5] px-5" aria-label="Nepfluence home">
        <span className="grid size-9 rotate-[-35deg] grid-cols-3 gap-1">
          {Array.from({ length: 9 }).map((_, index) => (
            <span
              key={index}
              className="rounded-full bg-[#7894ff]"
              style={{ opacity: index % 2 === 0 ? 1 : 0.58 }}
            />
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
                activeSection === item.label
                  ? "bg-[#eef1ff] text-[#6174f8]"
                  : "text-[#555866] hover:bg-[#f7f8fc] hover:text-[#17171f]"
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
          <p className="text-xs font-black uppercase text-[#aeb8ff]">MVP workflow</p>
          <p className="mt-2 text-sm font-bold leading-5 text-white/86">Campaigns, escrow, chat, deliverables, and reviews stay connected.</p>
          <button
            className="mt-4 inline-flex h-8 items-center gap-2 rounded-full bg-white px-3 text-xs font-black text-[#151525]"
            type="button"
            onClick={() => setLifecycleOpen(true)}
          >
            View lifecycle <ArrowRight className="size-3" aria-hidden="true" />
          </button>
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
            <button
              className="absolute inset-0 bg-black/32"
              type="button"
              aria-label="Close menu"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative h-full w-[min(320px,88vw)] shadow-2xl">{shell}</div>
          </div>
        )}

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b border-[#e7e9f2] bg-white/92 backdrop-blur-xl">
            <div className="flex h-16 items-center justify-between gap-3 px-4 lg:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  className="grid size-10 place-items-center rounded-[8px] border border-[#e1e4ef] bg-white lg:hidden"
                  type="button"
                  aria-label="Open mobile menu"
                  onClick={() => setMobileMenuOpen(true)}
                >
                  <Menu className="size-5" aria-hidden="true" />
                </button>
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase text-[#6174f8]">Brand workspace</p>
                  <h1 className="truncate text-2xl font-black">{activeSection}</h1>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="hidden h-10 items-center gap-2 rounded-[8px] border border-[#e1e4ef] bg-white px-3 text-sm font-bold text-[#555866] sm:inline-flex"
                  type="button"
                  onClick={() => setLifecycleOpen(true)}
                >
                  <ShieldCheck className="size-4" aria-hidden="true" />
                  Lifecycle
                </button>
                <button className="grid size-10 place-items-center rounded-[8px] border border-[#e1e4ef] bg-white" type="button" aria-label="Notifications" onClick={() => setNotificationOpen((open) => !open)}>
                  <Bell className="size-4" aria-hidden="true" />
                </button>
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-[#6174f8] px-4 text-sm font-black text-white shadow-[0_10px_20px_rgba(76,91,210,0.24)]"
                  type="button"
                  onClick={() => setCampaignModalOpen(true)}
                >
                  <Plus className="size-4" aria-hidden="true" />
                  New campaign
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
                        <p className="text-sm font-black text-[#6174f8]">Today in Nepfluence</p>
                        <h2 className="mt-2 text-3xl font-black tracking-normal">Run campaigns from brief to payout</h2>
                        <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-[#666b7a]">
                          Manage campaign drafts, creator applications, escrow deposits, collaboration rooms, deliverables, and trust signals from one practical brand dashboard.
                        </p>
                      </div>
                      <button
                        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[8px] bg-[#17171f] px-4 text-sm font-black text-white"
                        type="button"
                        onClick={() => setCampaignModalOpen(true)}
                      >
                        Create campaign <ChevronRight className="size-4" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {analytics.map((item) => {
                        const Icon = item.icon

                        return (
                          <div key={item.label} className="rounded-[8px] border border-[#edf0f6] bg-[#fbfcff] p-4">
                            <span className="grid size-9 place-items-center rounded-[8px] bg-[#eef1ff] text-[#6174f8]">
                              <Icon className="size-4" aria-hidden="true" />
                            </span>
                            <div className="mt-4 text-3xl font-black">{item.value}</div>
                            <div className="mt-1 text-sm font-black text-[#484b57]">{item.label}</div>
                            <div className="mt-1 text-xs font-bold text-[#8a909f]">{item.detail}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <ActivityPanel activities={activities} />
                </section>

                <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                  <CampaignList campaigns={campaigns.slice(0, 3)} onPublish={publishCampaign} onManage={() => setActiveSection("Campaigns")} compact />
                  <ApplicationQueue applications={pendingApplications.slice(0, 3)} campaigns={campaigns} onReview={reviewApplication} />
                </section>
              </div>
            )}

            {activeSection === "Campaigns" && (
              <CampaignList campaigns={campaigns} onPublish={publishCampaign} onCreate={() => setCampaignModalOpen(true)} onManage={(title) => addActivity(`${title} opened for campaign management.`, "blue")} />
            )}

            {activeSection === "Applications" && (
              <ApplicationQueue applications={applications} campaigns={campaigns} onReview={reviewApplication} showResolved />
            )}

            {activeSection === "Collaborations" && (
              <CollaborationsPanel
                collaborations={collaborations}
                onDeposit={depositEscrow}
                onSubmit={markSubmitted}
                onApprove={approveDeliverable}
              />
            )}

            {activeSection === "Messages" && <MessagesPanel message={brandMessage} onMessageChange={setBrandMessage} onSend={sendBrandMessage} />}

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

            {activeSection === "Payments" && <PaymentsPanel collaborations={collaborations} paymentTotal={paymentTotal} onDeposit={depositEscrow} onSubmit={markSubmitted} onApprove={approveDeliverable} />}

            {activeSection === "Trust & Reports" && <TrustPanel />}
          </div>
        </section>
      </div>

      <button
        className="fixed bottom-5 right-5 z-40 grid size-12 place-items-center rounded-full bg-[#6174f8] text-white shadow-[0_10px_24px_rgba(76,91,210,0.36)]"
        type="button"
        aria-label="Open support chat"
        onClick={() => setChatOpen(true)}
      >
        <MessageSquare className="size-5" aria-hidden="true" />
      </button>

      {notificationOpen && (
        <NotificationPanel activities={activities} onClose={() => setNotificationOpen(false)} />
      )}

      {campaignModalOpen && (
        <CampaignFormModal
          form={form}
          onChange={setForm}
          onClose={() => setCampaignModalOpen(false)}
          onSubmit={submitCampaign}
        />
      )}

      {lifecycleOpen && <LifecycleModal onClose={() => setLifecycleOpen(false)} />}

      {chatOpen && <SupportPanel onClose={() => setChatOpen(false)} />}
    </main>
  )
}

function CampaignList({
  campaigns,
  onPublish,
  onCreate,
  onManage,
  compact = false,
}: {
  campaigns: Campaign[]
  onPublish: (id: number) => void
  onCreate?: () => void
  onManage?: (title: string) => void
  compact?: boolean
}) {
  return (
    <section className="rounded-[8px] border border-[#e4e7f1] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#edf0f6] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black">Campaigns</h2>
          <p className="mt-1 text-sm font-medium text-[#727887]">Draft, publish, pause, and track creator application flow.</p>
        </div>
        {onCreate && (
          <button className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-[#6174f8] px-4 text-sm font-black text-white" type="button" onClick={onCreate}>
            <Plus className="size-4" aria-hidden="true" />
            New campaign
          </button>
        )}
      </div>

      <div className="divide-y divide-[#edf0f6]">
        {campaigns.map((campaign) => (
          <article key={campaign.id} className="grid gap-4 p-5 xl:grid-cols-[1fr_130px_130px_150px] xl:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-black">{campaign.title}</h3>
                <span className={`rounded-full px-2.5 py-1 text-xs font-black ${statusClass(campaign.status)}`}>{campaign.status}</span>
              </div>
              <p className="mt-2 text-sm font-medium leading-6 text-[#697080]">{campaign.brief}</p>
              {!compact && (
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-black text-[#697080]">
                  <span className="rounded-full bg-[#f3f5fb] px-2.5 py-1">{campaign.niche}</span>
                  <span className="rounded-full bg-[#f3f5fb] px-2.5 py-1">{campaign.platform}</span>
                  <span className="rounded-full bg-[#f3f5fb] px-2.5 py-1">{campaign.country}</span>
                </div>
              )}
            </div>
            <div>
              <div className="text-xs font-black uppercase text-[#9aa0ad]">Budget</div>
              <div className="mt-1 text-sm font-black">{money(campaign.budget)}</div>
            </div>
            <div>
              <div className="text-xs font-black uppercase text-[#9aa0ad]">Pipeline</div>
              <div className="mt-1 text-sm font-black">{campaign.applications} apps / {campaign.accepted} accepted</div>
            </div>
            <div className="flex gap-2 xl:justify-end">
              {campaign.status === "DRAFT" ? (
                <button className="h-9 rounded-[8px] bg-[#17171f] px-3 text-sm font-black text-white" type="button" onClick={() => onPublish(campaign.id)}>
                  Publish
                </button>
              ) : (
                <button className="h-9 rounded-[8px] border border-[#e1e4ef] px-3 text-sm font-black text-[#555866]" type="button" onClick={() => onManage?.(campaign.title)}>
                  Manage
                </button>
              )}
              <button className="grid size-9 place-items-center rounded-[8px] border border-[#e1e4ef]" type="button" aria-label="More campaign actions">
                <MoreHorizontal className="size-4" aria-hidden="true" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function ApplicationQueue({
  applications,
  campaigns,
  onReview,
  showResolved = false,
}: {
  applications: Application[]
  campaigns: Campaign[]
  onReview: (id: number, status: ApplicationStatus) => void
  showResolved?: boolean
}) {
  const visibleApplications = showResolved ? applications : applications.filter((application) => application.status === "PENDING")

  return (
    <section className="rounded-[8px] border border-[#e4e7f1] bg-white shadow-sm">
      <div className="border-b border-[#edf0f6] p-5">
        <h2 className="text-xl font-black">Applications</h2>
        <p className="mt-1 text-sm font-medium text-[#727887]">Accepting a creator triggers escrow and creates a collaboration room.</p>
      </div>
      <div className="divide-y divide-[#edf0f6]">
        {visibleApplications.map((application) => (
          <article key={application.id} className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-black">{application.creator}</h3>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-black ${statusClass(application.status)}`}>{application.status}</span>
                </div>
                <p className="mt-1 text-sm font-bold text-[#697080]">{application.handle} - {application.niche} - {application.followers} followers</p>
                <p className="mt-1 text-xs font-bold text-[#9aa0ad]">
                  Applying to {campaigns.find((campaign) => campaign.id === application.campaignId)?.title ?? "campaign"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#eef1ff] px-3 py-1 text-xs font-black text-[#6174f8]">{application.match}% match</span>
                {application.status === "PENDING" && (
                  <>
                    <button className="h-9 rounded-[8px] bg-[#16864f] px-3 text-sm font-black text-white" type="button" onClick={() => onReview(application.id, "ACCEPTED")}>
                      Accept
                    </button>
                    <button className="h-9 rounded-[8px] border border-[#f1d1d1] px-3 text-sm font-black text-[#b83232]" type="button" onClick={() => onReview(application.id, "REJECTED")}>
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function CollaborationsPanel({
  collaborations,
  onDeposit,
  onSubmit,
  onApprove,
}: {
  collaborations: Collaboration[]
  onDeposit: (id: number) => void
  onSubmit: (id: number) => void
  onApprove: (id: number) => void
}) {
  return (
    <section className="rounded-[8px] border border-[#e4e7f1] bg-white shadow-sm">
      <div className="border-b border-[#edf0f6] p-5">
        <h2 className="text-xl font-black">Collaborations</h2>
        <p className="mt-1 text-sm font-medium text-[#727887]">Escrow controls chat access and deliverable approval.</p>
      </div>
      <div className="grid gap-4 p-5 lg:grid-cols-2">
        {collaborations.map((collab) => (
          <article key={collab.id} className="rounded-[8px] border border-[#edf0f6] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-black">{collab.campaign}</h3>
                <p className="mt-1 text-sm font-bold text-[#697080]">{collab.creator}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-black ${statusClass(collab.state)}`}>{collab.state}</span>
            </div>
            <p className="mt-4 rounded-[8px] bg-[#f7f8fb] p-3 text-sm font-bold text-[#606675]">{collab.deliverable}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {collab.escrow === "PENDING" && (
                <button className="h-9 rounded-[8px] bg-[#6174f8] px-3 text-sm font-black text-white" type="button" onClick={() => onDeposit(collab.id)}>
                  Deposit escrow
                </button>
              )}
              {collab.state === "IN_PROGRESS" && (
                <button className="h-9 rounded-[8px] border border-[#e1e4ef] px-3 text-sm font-black" type="button" onClick={() => onSubmit(collab.id)}>
                  Mark submitted
                </button>
              )}
              {collab.state === "SUBMITTED" && (
                <button className="h-9 rounded-[8px] bg-[#16864f] px-3 text-sm font-black text-white" type="button" onClick={() => onApprove(collab.id)}>
                  Approve deliverable
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function DiscoverPanel({
  creators,
  filter,
  search,
  selectedCreator,
  onFilter,
  onSearch,
  onSelect,
  onShortlist,
}: {
  creators: Creator[]
  filter: "ALL" | "NP" | "IN"
  search: string
  selectedCreator: Creator
  onFilter: (filter: "ALL" | "NP" | "IN") => void
  onSearch: (search: string) => void
  onSelect: (creator: Creator) => void
  onShortlist: (name: string) => void
}) {
  return (
    <section className="space-y-4">
      <div className="rounded-[8px] border border-[#e4e7f1] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-black">Discover Creators</h2>
            <p className="mt-1 text-sm font-medium text-[#727887]">Manual discovery first, matching engine later when the marketplace has data.</p>
          </div>
          <label className="flex items-center gap-2 rounded-[8px] border border-[#e1e4ef] px-3 py-2 text-sm font-bold text-[#727887]">
            <Search className="size-4" aria-hidden="true" />
            <input
              className="w-full bg-transparent text-sm font-bold outline-none placeholder:text-[#727887]"
              value={search}
              onChange={(event) => onSearch(event.target.value)}
              placeholder="Search by niche, country, handle"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {(["ALL", "NP", "IN"] as const).map((country) => (
            <button
              key={country}
              className={`rounded-full px-4 py-2 text-sm font-black ${filter === country ? "bg-[#6174f8] text-white" : "bg-[#f3f5fb] text-[#606675]"}`}
              type="button"
              onClick={() => onFilter(country)}
            >
              {country === "ALL" ? "All countries" : country}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {creators.map((creator) => (
            <button
              key={creator.handle}
              className={`overflow-hidden rounded-[8px] border bg-white text-left shadow-sm transition ${
                selectedCreator.handle === creator.handle ? "border-[#6174f8] ring-2 ring-[#dfe3ff]" : "border-[#e4e7f1] hover:-translate-y-0.5"
              }`}
              type="button"
              onClick={() => onSelect(creator)}
            >
              <div className="h-36 bg-cover bg-center" style={{ backgroundImage: `url(${creator.image})` }} />
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-black">{creator.name}</h3>
                  <span className="rounded-full bg-[#f3f5fb] px-2 py-1 text-xs font-black">{creator.country}</span>
                </div>
                <p className="mt-1 text-sm font-bold text-[#727887]">{creator.handle}</p>
                <div className="mt-3 flex items-center justify-between text-xs font-black text-[#606675]">
                  <span>{creator.niche}</span>
                  <span>{creator.followers} followers</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        <aside className="rounded-[8px] border border-[#e4e7f1] bg-white p-5 shadow-sm">
          <div className="h-44 rounded-[8px] bg-cover bg-center" style={{ backgroundImage: `url(${selectedCreator.image})` }} />
          <h3 className="mt-4 text-xl font-black">{selectedCreator.name}</h3>
          <p className="mt-1 text-sm font-bold text-[#727887]">{selectedCreator.handle} - {selectedCreator.country}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-[8px] bg-[#f7f8fb] p-3">
              <div className="font-black">{selectedCreator.followers}</div>
              <div className="text-xs font-bold text-[#8a909f]">Followers</div>
            </div>
            <div className="rounded-[8px] bg-[#f7f8fb] p-3">
              <div className="flex items-center gap-1 font-black"><Star className="size-4 fill-[#f7b733] text-[#f7b733]" /> {selectedCreator.rating}</div>
              <div className="text-xs font-bold text-[#8a909f]">Rating</div>
            </div>
          </div>
          <button className="mt-4 h-10 w-full rounded-[8px] bg-[#6174f8] text-sm font-black text-white" type="button" onClick={() => onShortlist(selectedCreator.name)}>
            Shortlist creator
          </button>
        </aside>
      </div>
    </section>
  )
}

function PaymentsPanel({
  collaborations,
  paymentTotal,
  onDeposit,
  onSubmit,
  onApprove,
}: {
  collaborations: Collaboration[]
  paymentTotal: number
  onDeposit: (id: number) => void
  onSubmit: (id: number) => void
  onApprove: (id: number) => void
}) {
  return (
    <section className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard icon={WalletCards} label="Escrow held" value={money(paymentTotal)} detail="Mock provider for MVP" />
        <MetricCard icon={IndianRupee} label="Pending deposit" value={collaborations.filter((item) => item.escrow === "PENDING").length.toString()} detail="Required before chat" />
        <MetricCard icon={CheckCircle2} label="Released payouts" value={collaborations.filter((item) => item.escrow === "RELEASED").length.toString()} detail="Queued for payout" />
      </div>
      <CollaborationsPanel collaborations={collaborations} onDeposit={onDeposit} onSubmit={onSubmit} onApprove={onApprove} />
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
        {["Sujata KC", "Aarati Rai", "Kabir Rao"].map((name, index) => (
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
          <h2 className="text-xl font-black">Sujata KC</h2>
          <p className="mt-1 text-sm font-medium text-[#727887]">Chat is unlocked because escrow is held.</p>
        </div>
        <div className="space-y-3 p-5">
          <p className="max-w-md rounded-[8px] bg-[#f3f5fb] p-3 text-sm font-bold text-[#555866]">I will submit the first draft by Friday.</p>
          <p className="ml-auto max-w-md rounded-[8px] bg-[#6174f8] p-3 text-sm font-bold text-white">Great. Please keep the product close-up in first 3 seconds.</p>
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

function TrustPanel() {
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <MetricCard icon={BadgeCheck} label="Verified creators" value="4/5" detail="Manual profile review" />
      <MetricCard icon={AlertTriangle} label="Open disputes" value="0" detail="Admin queue clear" />
      <MetricCard icon={ShieldCheck} label="Escrow protected" value="100%" detail="Brand to creator only" />
      <div className="rounded-[8px] border border-[#e4e7f1] bg-white p-5 shadow-sm lg:col-span-3">
        <h2 className="text-xl font-black">Trust rules from the architecture</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {["Campaign brief locks after creator acceptance.", "Influencer never deposits money to brand.", "Disputes hold escrow until admin resolution."].map((rule) => (
            <div key={rule} className="rounded-[8px] bg-[#f7f8fb] p-4 text-sm font-bold text-[#555866]">{rule}</div>
          ))}
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
          <p className="mt-1 text-sm font-medium text-[#727887]">Updates from local dashboard actions.</p>
        </div>
        <span className="rounded-full bg-[#eef1ff] px-3 py-1 text-xs font-black text-[#6174f8]">Live UI</span>
      </div>
      <div className="mt-5 space-y-3">
        {activities.map((activity) => (
          <div key={activity.id} className="flex gap-3">
            <span className={`mt-1 size-2.5 shrink-0 rounded-full ${activity.tone === "green" ? "bg-[#1f9f68]" : activity.tone === "amber" ? "bg-[#e5a122]" : activity.tone === "red" ? "bg-[#d94b4b]" : "bg-[#6174f8]"}`} />
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
          <h2 className="text-lg font-black">Workspace updates</h2>
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

function CampaignFormModal({
  form,
  onChange,
  onClose,
  onSubmit,
}: {
  form: typeof emptyCampaignForm
  onChange: (form: typeof emptyCampaignForm) => void
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/34 px-4 py-6">
      <form className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[8px] bg-white shadow-[0_24px_70px_rgba(20,21,34,0.28)]" onSubmit={onSubmit}>
        <div className="flex items-start justify-between gap-4 border-b border-[#edf0f6] p-5">
          <div>
            <p className="text-xs font-black uppercase text-[#6174f8]">Campaigns domain</p>
            <h2 className="mt-1 text-2xl font-black">Create campaign draft</h2>
            <p className="mt-1 text-sm font-medium text-[#727887]">This creates DRAFT state first. Publish after reviewing brief and budget.</p>
          </div>
          <button className="grid size-9 place-items-center rounded-full bg-[#f3f5fb]" type="button" aria-label="Close campaign form" onClick={onClose}>
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-2">
          <Field label="Campaign title">
            <input required className="input" value={form.title} onChange={(event) => onChange({ ...form, title: event.target.value })} placeholder="e.g. Himal Glow creator launch" />
          </Field>
          <Field label="Niche">
            <select className="input" value={form.niche} onChange={(event) => onChange({ ...form, niche: event.target.value })}>
              {["Beauty", "Food", "Travel", "Lifestyle", "Fashion", "Tech"].map((item) => <option key={item}>{item}</option>)}
            </select>
          </Field>
          <Field label="Budget">
            <input className="input" value={form.budget} onChange={(event) => onChange({ ...form, budget: event.target.value })} inputMode="numeric" />
          </Field>
          <Field label="Country">
            <select className="input" value={form.country} onChange={(event) => onChange({ ...form, country: event.target.value as "NP" | "IN" })}>
              <option value="NP">Nepal</option>
              <option value="IN">India</option>
            </select>
          </Field>
          <Field label="Platform">
            <select className="input" value={form.platform} onChange={(event) => onChange({ ...form, platform: event.target.value })}>
              {["Instagram Reels", "TikTok", "YouTube Shorts", "Instagram Stories"].map((item) => <option key={item}>{item}</option>)}
            </select>
          </Field>
          <Field label="Deadline">
            <input className="input" type="date" value={form.deadline} onChange={(event) => onChange({ ...form, deadline: event.target.value })} />
          </Field>
          <Field label="Brief" wide>
            <textarea required className="input min-h-28 resize-none py-3" value={form.brief} onChange={(event) => onChange({ ...form, brief: event.target.value })} placeholder="Describe content format, must-have shots, revision rules, and approval criteria." />
          </Field>
          <div className="rounded-[8px] bg-[#f7f8fb] p-4 md:col-span-2">
            <div className="flex items-start gap-3">
              <Upload className="mt-0.5 size-5 text-[#6174f8]" aria-hidden="true" />
              <p className="text-sm font-bold leading-6 text-[#606675]">
                File upload will later use S3 presigned URLs from the architecture. For now this form stores a local campaign draft.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-[#edf0f6] p-5">
          <button className="h-10 rounded-[8px] border border-[#e1e4ef] px-4 text-sm font-black" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="h-10 rounded-[8px] bg-[#6174f8] px-4 text-sm font-black text-white" type="submit">
            Save draft
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`text-sm font-black text-[#484b57] ${wide ? "md:col-span-2" : ""}`}>
      {label}
      <div className="mt-2 [&_.input]:h-11 [&_.input]:w-full [&_.input]:rounded-[8px] [&_.input]:border [&_.input]:border-[#dfe3ee] [&_.input]:bg-white [&_.input]:px-3 [&_.input]:text-sm [&_.input]:font-bold [&_.input]:outline-none [&_.input]:transition [&_.input]:focus:border-[#6174f8] [&_.input]:focus:ring-4 [&_.input]:focus:ring-[#6174f8]/10">
        {children}
      </div>
    </label>
  )
}

function LifecycleModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/34 px-4">
      <section className="w-full max-w-lg rounded-[8px] bg-white p-5 shadow-[0_24px_70px_rgba(20,21,34,0.28)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase text-[#6174f8]">Architecture pattern</p>
            <h2 className="mt-1 text-2xl font-black">Campaign to payout lifecycle</h2>
          </div>
          <button className="grid size-9 place-items-center rounded-full bg-[#f3f5fb]" type="button" aria-label="Close lifecycle" onClick={onClose}>
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-5 space-y-3">
          {lifecycleSteps.map((step, index) => (
            <div key={step} className="flex items-center gap-3 rounded-[8px] border border-[#edf0f6] p-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#eef1ff] text-xs font-black text-[#6174f8]">{index + 1}</span>
              <p className="text-sm font-bold text-[#555866]">{step}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function SupportPanel({ onClose }: { onClose: () => void }) {
  return (
    <section className="fixed bottom-20 right-5 z-50 w-[min(380px,calc(100vw-2rem))] rounded-[8px] border border-[#e4e7f1] bg-white shadow-[0_18px_50px_rgba(25,28,50,0.2)]">
      <div className="flex items-start justify-between gap-3 border-b border-[#edf0f6] p-4">
        <div>
          <p className="text-xs font-black uppercase text-[#6174f8]">Build note</p>
          <h2 className="text-lg font-black">Next integration step</h2>
        </div>
        <button className="grid size-8 place-items-center rounded-full bg-[#f3f5fb]" type="button" aria-label="Close support" onClick={onClose}>
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="space-y-3 p-4 text-sm font-bold leading-6 text-[#606675]">
        <p className="rounded-[8px] bg-[#f7f8fb] p-3">This UI now models real MVP flows locally. Backend wiring should map to campaigns, applications, collaboration, payments, and trust modules.</p>
        <p className="rounded-[8px] bg-[#eef1ff] p-3 text-[#5268df]">Use TanStack Query mutations once FastAPI routes are ready.</p>
      </div>
    </section>
  )
}
