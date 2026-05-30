"use client"

import { ChevronRight, Megaphone, UsersRound } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ApplicationStatus, MarketplaceApplication as Application, MarketplaceCampaign as Campaign } from "@/features/shared/marketplaceStore"
import { ActivityPanel, ApplicationQueue, CampaignList } from "./BrandDashboardPanels"
import { type Activity, campaignImage, initialCampaigns } from "./brand-dashboard.shared"

type BrandDashboardHomeProps = {
  activities: Activity[]
  analytics: { label: string; value: string; detail: string; icon: LucideIcon }[]
  campaigns: Campaign[]
  pendingApplications: Application[]
  onCreateCampaign: () => void
  onDiscoverCreators: () => void
  onManageCampaigns: () => void
  onPublishCampaign: (id: number) => void
  onReviewApplication: (id: number, status: ApplicationStatus) => void
}

export function BrandDashboardHome({
  activities,
  analytics,
  campaigns,
  pendingApplications,
  onCreateCampaign,
  onDiscoverCreators,
  onManageCampaigns,
  onPublishCampaign,
  onReviewApplication,
}: BrandDashboardHomeProps) {
  return (
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
                <Button className="h-10 rounded-[8px] bg-[#7894ff] px-4 text-sm font-black text-white hover:bg-[#6f86f4]" type="button" onClick={onCreateCampaign}>
                  Create campaign <ChevronRight className="size-4" aria-hidden="true" />
                </Button>
                <Button className="h-10 rounded-[8px] border-white/15 bg-white/10 px-4 text-sm font-black text-white hover:bg-white/15" variant="outline" type="button" onClick={onDiscoverCreators}>
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
        <CampaignList campaigns={campaigns.slice(0, 3)} onPublish={onPublishCampaign} onManage={onManageCampaigns} compact />
        <ApplicationQueue applications={pendingApplications.slice(0, 3)} campaigns={campaigns} onReview={onReviewApplication} />
      </section>
    </div>
  )
}
