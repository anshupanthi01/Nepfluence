"use client"

import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Bell,
  Boxes,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  CreditCard,
  FileText,
  Globe,
  IndianRupee,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Megaphone,
  MoreHorizontal,
  PlayCircle,
  Plus,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Upload,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react"
import { FormEvent, ReactNode, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
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
  | "Brand Profile"
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
  { label: "Brand Profile", icon: Building2 },
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

const creatorWorkSamples = [
  {
    title: "Skincare morning reel",
    creator: "@aaratiugc",
    platform: "Instagram Reels",
    metric: "8.4% engagement",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=640&q=80",
  },
  {
    title: "Local cafe product story",
    creator: "@aaratiugc",
    platform: "TikTok",
    metric: "31K views",
    image: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=640&q=80",
  },
  {
    title: "Beauty shelf UGC",
    creator: "@aaratiugc",
    platform: "YouTube Shorts",
    metric: "12 brand saves",
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=640&q=80",
  },
  {
    title: "Cleanser hook test",
    creator: "@aaratiugc",
    platform: "Instagram Reels",
    metric: "4.9% CTR",
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=640&q=80",
  },
  {
    title: "GRWM product mention",
    creator: "@aaratiugc",
    platform: "TikTok",
    metric: "18K saves",
    image: "https://images.unsplash.com/photo-1487412912498-0447578fcca8?auto=format&fit=crop&w=640&q=80",
  },
]

const creatorAnalytics = {
  "@aaratiugc": {
    engagementRate: "8.4%",
    avgViews: "31K",
    avgLikes: "2.6K",
    monthlyReach: "284K",
    saves: "18K",
    completionRate: "71%",
    responseTime: "12h",
    audience: [
      { label: "Nepal", value: "68%" },
      { label: "India", value: "21%" },
      { label: "Other", value: "11%" },
    ],
    age: [
      { label: "18-24", value: "44%" },
      { label: "25-34", value: "39%" },
      { label: "35+", value: "17%" },
    ],
  },
}

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

function campaignImage(campaign: Pick<Campaign, "niche" | "title">) {
  const key = `${campaign.niche} ${campaign.title}`.toLowerCase()

  if (key.includes("food") || key.includes("momo")) {
    return "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=760&q=80"
  }

  if (key.includes("tea") || key.includes("lifestyle")) {
    return "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=760&q=80"
  }

  return "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=760&q=80"
}

function creatorImage(handle: string) {
  return creators.find((creator) => creator.handle === handle)?.image ?? "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=320&q=80"
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

    const room = collaborations.find((collab) => collab.id === selectedRoomId)
    marketplace.sendMessage(selectedRoomId, {
      sender: "brand",
      senderName: room?.brand ?? "Brand",
      body: message,
    })
    setBrandMessage("")
    addActivity("Message sent to creator collaboration room.", "blue")
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
                  <div className="overflow-hidden rounded-[8px] border border-[#dfe3f2] bg-white shadow-sm">
                    <div className="grid gap-5 bg-[#111322] p-5 text-white lg:grid-cols-[1fr_320px]">
                      <div>
                        <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-black text-[#b9c3ff]">
                          <Megaphone className="size-4" aria-hidden="true" />
                          Brand campaign studio
                        </p>
                        <h2 className="mt-4 max-w-2xl text-3xl font-black tracking-normal">Run campaigns from brief to payout</h2>
                        <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-white/72">
                          Manage campaign drafts, creator applications, escrow deposits, collaboration rooms, deliverables, and trust signals from one polished brand workspace.
                        </p>
                        <div className="mt-5 flex flex-wrap gap-2">
                          <Button
                            className="h-10 rounded-[8px] bg-[#7894ff] px-4 text-sm font-black text-white hover:bg-[#6f86f4]"
                            type="button"
                            onClick={() => setCampaignModalOpen(true)}
                          >
                            Create campaign <ChevronRight className="size-4" aria-hidden="true" />
                          </Button>
                          <Button
                            className="h-10 rounded-[8px] border-white/15 bg-white/10 px-4 text-sm font-black text-white hover:bg-white/15"
                            variant="outline"
                            type="button"
                            onClick={() => setActiveSection("Discover Creators")}
                          >
                            Discover creators <UsersRound className="size-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </div>
                      <div className="overflow-hidden rounded-[8px] border border-white/12 bg-white/8">
                        <div className="h-36 bg-cover bg-center" style={{ backgroundImage: `url(${campaignImage(campaigns[0] ?? initialCampaigns[0])})` }} />
                        <div className="p-4">
                          <p className="text-xs font-black uppercase text-[#b9c3ff]">Featured live campaign</p>
                          <p className="mt-1 text-lg font-black">{campaigns[0]?.title ?? "Himal Glow winter launch"}</p>
                          <p className="mt-1 text-sm font-bold text-white/62">{campaigns[0]?.applications ?? 18} applications in review</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
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

            {activeSection === "Payments" && <PaymentsPanel collaborations={collaborations} paymentTotal={paymentTotal} onDeposit={depositEscrow} onSubmit={markSubmitted} onApprove={approveDeliverable} />}

            {activeSection === "Brand Profile" && <BrandProfilePanel campaigns={campaigns} collaborations={collaborations} />}

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
          <Button className="h-10 rounded-[8px] bg-[#6174f8] px-4 text-sm font-black text-white hover:bg-[#5268df]" type="button" onClick={onCreate}>
            <Plus className="size-4" aria-hidden="true" />
            New campaign
          </Button>
        )}
      </div>

      <div className="grid gap-4 p-5">
        {campaigns.map((campaign) => (
          <article key={campaign.id} className="grid overflow-hidden rounded-[8px] border border-[#edf0f6] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(43,48,79,0.1)] xl:grid-cols-[210px_1fr]">
            <div className="relative min-h-40 bg-cover bg-center" style={{ backgroundImage: `url(${campaignImage(campaign)})` }}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/62 via-black/10 to-transparent" />
              <span className={`absolute left-4 top-4 rounded-full px-2.5 py-1 text-xs font-black ${statusClass(campaign.status)}`}>{campaign.status}</span>
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-xs font-black uppercase text-white/72">{campaign.niche} - {campaign.platform}</p>
                <h3 className="mt-1 text-lg font-black text-white">{campaign.title}</h3>
              </div>
            </div>
            <div className="grid gap-3 p-4 xl:grid-cols-[1fr_120px_140px_130px] xl:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-black">{campaign.title}</h3>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-black ${statusClass(campaign.status)}`}>{campaign.status}</span>
                </div>
                <p className="mt-1.5 text-sm font-medium leading-5 text-[#697080]">{campaign.brief}</p>
                {!compact && (
                  <div className="mt-2.5 flex flex-wrap gap-2 text-xs font-black text-[#697080]">
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
                  <Button className="h-9 rounded-[8px] bg-[#17171f] px-3 text-sm font-black text-white hover:bg-[#262636]" type="button" onClick={() => onPublish(campaign.id)}>
                    Publish
                  </Button>
                ) : (
                  <Button className="h-9 rounded-[8px] px-3 text-sm font-black text-[#555866]" variant="outline" type="button" onClick={() => onManage?.(campaign.title)}>
                    Manage
                  </Button>
                )}
                <button className="grid size-9 place-items-center rounded-[8px] border border-[#e1e4ef]" type="button" aria-label="More campaign actions">
                  <MoreHorizontal className="size-4" aria-hidden="true" />
                </button>
              </div>
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
              <div className="flex min-w-0 gap-3">
                <div className="size-14 shrink-0 rounded-[8px] bg-cover bg-center" style={{ backgroundImage: `url(${creatorImage(application.handle)})` }} />
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
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#eef1ff] px-3 py-1 text-xs font-black text-[#6174f8]">{application.match}% match</span>
                {application.status === "PENDING" && (
                  <>
                    <Button className="h-9 rounded-[8px] bg-[#16864f] px-3 text-sm font-black text-white hover:bg-[#127344]" type="button" onClick={() => onReview(application.id, "ACCEPTED")}>
                      Accept
                    </Button>
                    <Button className="h-9 rounded-[8px] border-[#f1d1d1] px-3 text-sm font-black text-[#b83232]" variant="outline" type="button" onClick={() => onReview(application.id, "REJECTED")}>
                      Reject
                    </Button>
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
            {collab.submission ? (
              <div className="mt-4 overflow-hidden rounded-[8px] border border-[#dfe4ff] bg-[#fbfcff]">
                <div className="grid min-h-40 place-items-center bg-[#111322] p-5 text-center text-white">
                  <div>
                    <PlayCircle className="mx-auto size-10 text-[#9fb0ff]" aria-hidden="true" />
                    <p className="mt-3 text-sm font-black">Creator video ready for review</p>
                    <a className="mt-2 inline-flex text-xs font-black text-[#b9c3ff] hover:underline" href={collab.submission.videoUrl} target="_blank" rel="noreferrer">
                      Open video draft
                    </a>
                  </div>
                </div>
                <div className="space-y-3 p-4">
                  <div className="grid grid-cols-2 gap-2">
                    <MiniReviewStat label="Format" value={collab.submission.aspectRatio} />
                    <MiniReviewStat label="Duration" value={collab.submission.duration} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase text-[#9aa0ad]">Caption</p>
                    <p className="mt-1 text-sm font-bold leading-6 text-[#555866]">{collab.submission.caption || "No caption added."}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase text-[#9aa0ad]">Creator notes</p>
                    <p className="mt-1 text-sm font-bold leading-6 text-[#555866]">{collab.submission.notes || "No notes added."}</p>
                  </div>
                  <div className="grid gap-2">
                    {[
                      ["Brief matched", collab.submission.checklist.briefMatched],
                      ["Usage rights confirmed", collab.submission.checklist.usageRights],
                      ["No copyrighted music", collab.submission.checklist.noCopyrightMusic],
                    ].map(([label, checked]) => (
                      <div key={label as string} className="flex items-center justify-between rounded-[8px] bg-[#f7f8fb] p-2 text-xs font-black text-[#606675]">
                        <span>{label}</span>
                        <span className={checked ? "text-[#16864f]" : "text-[#b83232]"}>{checked ? "Done" : "Missing"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-[8px] border border-dashed border-[#dfe3ee] bg-[#fbfcff] p-4 text-sm font-bold text-[#727887]">
                Waiting for creator to submit the required video and review form.
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {collab.escrow === "PENDING" && (
                <button className="h-9 rounded-[8px] bg-[#6174f8] px-3 text-sm font-black text-white" type="button" onClick={() => onDeposit(collab.id)}>
                  Deposit escrow
                </button>
              )}
              {collab.state === "IN_PROGRESS" && (
                <span className="inline-flex h-9 items-center rounded-[8px] border border-[#e1e4ef] px-3 text-sm font-black text-[#555866]">
                  Awaiting video
                </span>
              )}
              {collab.state === "SUBMITTED" && (
                <button className="h-9 rounded-[8px] bg-[#16864f] px-3 text-sm font-black text-white" type="button" onClick={() => onApprove(collab.id)} disabled={!collab.submission}>
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

function MiniReviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] bg-[#f7f8fb] p-3">
      <div className="text-xs font-bold text-[#8a909f]">{label}</div>
      <div className="mt-1 text-sm font-black text-[#484b57]">{value}</div>
    </div>
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
  const selectedWork = creatorWorkSamples.filter((sample) => sample.creator === selectedCreator.handle)
  const analytics = creatorAnalytics[selectedCreator.handle as keyof typeof creatorAnalytics]

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

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
          {creators.map((creator) => (
            <button
              key={creator.handle}
              className={`overflow-hidden rounded-[8px] border bg-white text-left shadow-sm transition ${
                selectedCreator.handle === creator.handle ? "border-[#6174f8] ring-2 ring-[#dfe3ff]" : "border-[#e4e7f1] hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(43,48,79,0.1)]"
              }`}
              type="button"
              onClick={() => onSelect(creator)}
            >
              <div className="relative aspect-[4/3] bg-cover bg-center" style={{ backgroundImage: `url(${creator.image})` }}>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/62 to-transparent p-3">
                  <p className="text-xs font-black text-white">{creator.niche}</p>
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate text-sm font-black">{creator.name}</h3>
                  <span className="rounded-full bg-[#f3f5fb] px-2 py-0.5 text-[11px] font-black">{creator.country}</span>
                </div>
                <p className="mt-1 truncate text-xs font-bold text-[#727887]">{creator.handle}</p>
                <div className="mt-3 flex items-center justify-between text-[11px] font-black text-[#606675]">
                  <span>{creator.followers}</span>
                  <span className="inline-flex items-center gap-1">
                    <Star className="size-3 fill-[#f7b733] text-[#f7b733]" aria-hidden="true" />
                    {creator.rating}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        <aside className="rounded-[8px] border border-[#e4e7f1] bg-white p-5 shadow-sm">
          <div className="h-36 rounded-[8px] bg-cover bg-center" style={{ backgroundImage: `url(${selectedCreator.image})` }} />
          <h3 className="mt-4 text-lg font-black">{selectedCreator.name}</h3>
          <p className="mt-1 text-sm font-bold text-[#727887]">{selectedCreator.handle} - {selectedCreator.country}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-[8px] bg-[#f7f8fb] p-2.5">
              <div className="font-black">{selectedCreator.followers}</div>
              <div className="text-xs font-bold text-[#8a909f]">Followers</div>
            </div>
            <div className="rounded-[8px] bg-[#f7f8fb] p-2.5">
              <div className="flex items-center gap-1 font-black"><Star className="size-4 fill-[#f7b733] text-[#f7b733]" /> {selectedCreator.rating}</div>
              <div className="text-xs font-bold text-[#8a909f]">Rating</div>
            </div>
          </div>
          <button className="mt-4 h-9 w-full rounded-[8px] bg-[#6174f8] text-sm font-black text-white" type="button" onClick={() => onShortlist(selectedCreator.name)}>
            Shortlist creator
          </button>
        </aside>
      </div>

      <section className="rounded-[8px] border border-[#e4e7f1] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-black">Creator work</h2>
            <p className="mt-1 text-sm font-medium text-[#727887]">Past videos posted on Nepfluence for brand review.</p>
          </div>
          <span className="rounded-full bg-[#eef1ff] px-3 py-1 text-xs font-black text-[#6174f8]">{selectedWork.length || 0} samples</span>
        </div>

        {selectedWork.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {selectedWork.map((sample) => (
              <article key={sample.title} className="overflow-hidden rounded-[8px] border border-[#edf0f6]">
                <div className="relative h-40 bg-cover bg-center" style={{ backgroundImage: `url(${sample.image})` }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/58 via-transparent to-transparent" />
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-1 text-[11px] font-black text-[#26233d]">Video</span>
                  <span className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-black/45 text-white backdrop-blur">
                    <PlayCircle className="size-4" aria-hidden="true" />
                  </span>
                  <p className="absolute bottom-3 left-3 right-3 text-xs font-black text-white">{sample.platform}</p>
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-black">{sample.title}</h3>
                  <p className="mt-1 text-xs font-bold text-[#727887]">{sample.metric}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-[8px] border border-dashed border-[#dfe3ee] bg-[#fbfcff] p-5 text-sm font-bold text-[#727887]">
            This creator has not posted portfolio videos yet.
          </div>
        )}
      </section>

      <section className="rounded-[8px] border border-[#e4e7f1] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-black">Creator analytics</h2>
            <p className="mt-1 text-sm font-medium text-[#727887]">Performance details brands can use before shortlisting or accepting applications.</p>
          </div>
          <span className="rounded-full bg-[#e9f8ef] px-3 py-1 text-xs font-black text-[#16864f]">Verified metrics</span>
        </div>

        {analytics ? (
          <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <AnalyticsCard label="Engagement rate" value={analytics.engagementRate} detail="Likes, comments, saves" />
              <AnalyticsCard label="Average views" value={analytics.avgViews} detail="Last 30 days" />
              <AnalyticsCard label="Average likes" value={analytics.avgLikes} detail="Per short-form post" />
              <AnalyticsCard label="Monthly reach" value={analytics.monthlyReach} detail="Estimated unique accounts" />
              <AnalyticsCard label="Saves" value={analytics.saves} detail="High intent actions" />
              <AnalyticsCard label="Completion rate" value={analytics.completionRate} detail="Video watch-through" />
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
              <AnalyticsBreakdown title="Audience location" items={analytics.audience} />
              <AnalyticsBreakdown title="Audience age" items={analytics.age} />
              <div className="rounded-[8px] border border-[#edf0f6] bg-[#111322] p-4 text-white">
                <p className="text-xs font-black uppercase text-[#b9c3ff]">Brand fit signal</p>
                <p className="mt-3 text-2xl font-black">Strong beauty match</p>
                <p className="mt-2 text-sm font-bold leading-6 text-white/68">
                  Best for skincare launches, product demos, local UGC, and short-form conversion hooks.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-[8px] border border-dashed border-[#dfe3ee] bg-[#fbfcff] p-5 text-sm font-bold text-[#727887]">
            Analytics will appear after this creator connects social accounts or posts work on Nepfluence.
          </div>
        )}
      </section>
    </section>
  )
}

function AnalyticsCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[8px] border border-[#edf0f6] bg-[#fbfcff] p-4">
      <p className="text-xs font-black uppercase text-[#8a909f]">{label}</p>
      <p className="mt-2 text-3xl font-black text-[#17171f]">{value}</p>
      <p className="mt-1 text-xs font-bold text-[#727887]">{detail}</p>
    </div>
  )
}

function AnalyticsBreakdown({ title, items }: { title: string; items: { label: string; value: string }[] }) {
  return (
    <div className="rounded-[8px] border border-[#edf0f6] p-4">
      <h3 className="text-sm font-black">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between text-xs font-black text-[#606675]">
              <span>{item.label}</span>
              <span>{item.value}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#eef1ff]">
              <div className="h-full rounded-full bg-[#6174f8]" style={{ width: item.value }} />
            </div>
          </div>
        ))}
      </div>
    </div>
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
            <span className="grid size-10 place-items-center rounded-full bg-[#6174f8] text-sm font-black text-white">{collab.creator.charAt(0)}</span>
            <span>
              <span className="block text-sm font-black">{collab.creator}</span>
              <span className="block text-xs font-bold text-[#8a909f]">{collab.campaign}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="rounded-[8px] border border-[#e4e7f1] bg-white shadow-sm">
        <div className="border-b border-[#edf0f6] p-5">
          <h2 className="text-xl font-black">{activeRoom?.creator ?? "Messages"}</h2>
          <p className="mt-1 text-sm font-medium text-[#727887]">{activeRoom?.escrow === "HELD" ? "Chat is unlocked because escrow is held." : "Chat unlocks when escrow is deposited."}</p>
        </div>
        <div className="min-h-[320px] space-y-3 p-5">
          {roomMessages.map((item) => (
            <div key={item.id} className={item.sender === "brand" ? "ml-auto max-w-md" : "max-w-md"}>
              <p className="mb-1 text-xs font-black text-[#8a909f]">{item.senderName}</p>
              <p className={`rounded-[8px] p-3 text-sm font-bold ${item.sender === "brand" ? "bg-[#6174f8] text-white" : "bg-[#f3f5fb] text-[#555866]"}`}>
                {item.body}
              </p>
            </div>
          ))}
          {roomMessages.length === 0 && (
            <p className="rounded-[8px] border border-dashed border-[#dfe3ee] p-4 text-sm font-bold text-[#727887]">No messages yet. Send the first collaboration update.</p>
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

function BrandProfilePanel({ campaigns, collaborations }: { campaigns: Campaign[]; collaborations: Collaboration[] }) {
  const liveCampaigns = campaigns.filter((campaign) => campaign.status === "OPEN").length
  const totalSpend = collaborations.reduce((sum, collab) => sum + collab.payout, 0)

  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <div className="overflow-hidden rounded-[8px] border border-[#e4e7f1] bg-white shadow-sm">
        <div className="relative min-h-56 bg-[#111322] p-5 text-white">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-32"
            style={{ backgroundImage: "url(https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1400&q=80)" }}
          />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="flex items-end gap-4">
              <div className="grid size-28 place-items-center rounded-[8px] bg-white text-3xl font-black text-[#6174f8] shadow-[0_18px_50px_rgba(0,0,0,0.25)] ring-4 ring-white/18">
                HG
              </div>
              <div>
                <p className="inline-flex items-center gap-1 rounded-full bg-white/12 px-3 py-1 text-xs font-black text-[#c9d1ff]">
                  <BadgeCheck className="size-3.5" aria-hidden="true" />
                  Verified brand
                </p>
                <h2 className="mt-3 text-3xl font-black">Himal Glow</h2>
                <p className="mt-1 text-sm font-bold text-white/70">Skincare brand - Kathmandu, Nepal</p>
              </div>
            </div>
            <Button className="h-10 rounded-[8px] bg-white px-4 text-sm font-black text-[#17171f] hover:bg-white/90" type="button">
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              Edit profile
            </Button>
          </div>
        </div>

        <div className="p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            <div className="rounded-[8px] border border-[#edf0f6] p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-black">Business details</h3>
                <Building2 className="size-4 text-[#6174f8]" aria-hidden="true" />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <BrandField label="Brand name" value="Himal Glow" />
                <BrandField label="Industry" value="Beauty & skincare" />
                <BrandField label="Website" value="himalglow.com" />
                <BrandField label="Location" value="Kathmandu, Nepal" />
              </div>
              <label className="mt-3 block text-sm font-black text-[#484b57]">
                Brand story
                <textarea
                  className="mt-2 min-h-24 w-full resize-none rounded-[8px] border border-[#dfe3ee] px-3 py-3 text-sm font-bold leading-6 outline-none focus:border-[#6174f8] focus:ring-4 focus:ring-[#6174f8]/10"
                  defaultValue="Himal Glow creates gentle skincare built around local routines, clean ingredients, and creator-led product education."
                />
              </label>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button className="h-9 rounded-[8px] bg-[#6174f8] px-4 text-sm font-black text-white hover:bg-[#5268df]" type="button">Save profile</Button>
                <Button className="h-9 rounded-[8px] px-4 text-sm font-black" variant="outline" type="button">
                  <Globe className="size-4" aria-hidden="true" />
                  Preview public page
                </Button>
              </div>
            </div>

            <div className="rounded-[8px] border border-[#edf0f6] p-4">
              <h3 className="text-lg font-black">Brand trust</h3>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <MiniReviewStat label="Live" value={liveCampaigns.toString()} />
                <MiniReviewStat label="Spend" value={money(totalSpend)} />
                <MiniReviewStat label="Rating" value="4.8" />
              </div>
              <div className="mt-4 space-y-3 text-sm font-bold text-[#555866]">
                <p className="flex items-center gap-2 rounded-[8px] bg-[#f7f8fb] p-3"><ShieldCheck className="size-4 text-[#16864f]" /> Escrow-backed collaborations</p>
                <p className="flex items-center gap-2 rounded-[8px] bg-[#f7f8fb] p-3"><BadgeCheck className="size-4 text-[#6174f8]" /> Verified campaign owner</p>
                <p className="flex items-center gap-2 rounded-[8px] bg-[#f7f8fb] p-3"><Star className="size-4 fill-[#f7b733] text-[#f7b733]" /> Strong creator response quality</p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[8px] border border-[#edf0f6] p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-lg font-black">Creator brief preferences</h3>
                <p className="mt-1 text-sm font-bold text-[#727887]">This helps creators understand the brand before applying.</p>
              </div>
              <span className="rounded-full bg-[#eef1ff] px-3 py-1 text-xs font-black text-[#6174f8]">Public to creators</span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                "Natural product close-ups in first 3 seconds.",
                "Creator voiceover preferred over heavy text overlays.",
                "No exaggerated medical claims or copyrighted sounds.",
              ].map((rule) => (
                <div key={rule} className="rounded-[8px] bg-[#fbfcff] p-4 text-sm font-bold leading-6 text-[#555866]">
                  {rule}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-[8px] border border-[#e4e7f1] bg-white p-5 shadow-sm">
          <h3 className="text-xl font-black">Public preview</h3>
          <div className="mt-4 overflow-hidden rounded-[8px] border border-[#edf0f6]">
            <div className="h-32 bg-cover bg-center" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80)" }} />
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="grid size-12 place-items-center rounded-[8px] bg-[#111322] text-sm font-black text-white">HG</div>
                <div>
                  <p className="font-black">Himal Glow</p>
                  <p className="text-xs font-bold text-[#727887]">Beauty & skincare</p>
                </div>
              </div>
              <p className="mt-3 text-sm font-bold leading-6 text-[#555866]">
                Clean skincare campaigns with creator-led demos, real routines, and local Nepal audience fit.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[8px] border border-[#e4e7f1] bg-white p-5 shadow-sm">
          <h3 className="text-xl font-black">Profile completeness</h3>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#eef1ff]">
            <div className="h-full w-[86%] rounded-full bg-[#6174f8]" />
          </div>
          <p className="mt-3 text-sm font-bold text-[#727887]">86% complete. Add legal billing details and campaign media kit.</p>
        </div>
      </aside>
    </section>
  )
}

function BrandField({ label, value }: { label: string; value: string }) {
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
