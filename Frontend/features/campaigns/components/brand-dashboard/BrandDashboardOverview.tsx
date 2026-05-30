/* eslint-disable @typescript-eslint/no-unused-vars */
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
import {
  ApplicationQueue,
  ActivityPanel,
  BrandProfilePanel,
  CampaignList,
  CollaborationsPanel,
  DiscoverPanel,
  MessagesPanel,
  MetricCard,
  NotificationPanel,
  PaymentsPanel,
  TrustPanel,
} from "./BrandDashboardPanels"
import { CampaignFormModal, LifecycleModal, SupportPanel } from "./BrandDashboardModals"
import { type Activity, type Section, campaignImage, creators, emptyCampaignForm, initialCampaigns, navItems } from "./brand-dashboard.shared"

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

            {activeSection === "Payments" && <PaymentsPanel collaborations={collaborations} paymentTotal={paymentTotal} onDeposit={depositEscrow} onApprove={approveDeliverable} />}

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
