"use client"

import { ArrowRight, Edit3, Sparkles } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { CreatorCampaign, Collaboration, Activity } from "./creator-dashboard.shared"
import { creatorProfileImage } from "./creator-dashboard.shared"
import { ActivityPanel, CampaignsPanel, CollaborationsPanel, MetricCard, MiniStat } from "./CreatorDashboardPanels"

type CreatorDashboardHomeProps = {
  activities: Activity[]
  campaigns: CreatorCampaign[]
  collaborations: Collaboration[]
  campaignSearch: string
  stats: { label: string; value: string; detail: string; icon: LucideIcon }[]
  onApply: (id: number) => void
  onBrowseCampaigns: () => void
  onEditProfile: () => void
  onMarkPaid: (id: number) => void
  onSearch: (search: string) => void
  onSubmit: (id: number) => void
  onWithdraw: (id: number) => void
}

export function CreatorDashboardHome({
  activities,
  campaigns,
  collaborations,
  campaignSearch,
  stats,
  onApply,
  onBrowseCampaigns,
  onEditProfile,
  onMarkPaid,
  onSearch,
  onSubmit,
  onWithdraw,
}: CreatorDashboardHomeProps) {
  return (
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
                <Button className="h-10 rounded-[8px] bg-[#7894ff] px-4 text-sm font-black text-white hover:bg-[#6f86f4]" type="button" onClick={onBrowseCampaigns}>
                  Browse campaigns <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
                <Button className="h-10 rounded-[8px] border-white/15 bg-white/10 px-4 text-sm font-black text-white hover:bg-white/15" variant="outline" type="button" onClick={onEditProfile}>
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
            <p className="text-sm font-black text-[#6174f8]">Creator home</p>
            <h3 className="mt-2 text-xl font-black tracking-normal">Live performance snapshot</h3>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((item) => <MetricCard key={item.label} icon={item.icon} label={item.label} value={item.value} detail={item.detail} />)}
            </div>
          </div>
        </div>
        <ActivityPanel activities={activities} />
      </section>
      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <CampaignsPanel campaigns={campaigns.slice(0, 3)} search={campaignSearch} onSearch={onSearch} onApply={onApply} onWithdraw={onWithdraw} compact />
        <CollaborationsPanel collaborations={collaborations} onSubmit={onSubmit} onMarkPaid={onMarkPaid} />
      </section>
    </div>
  )
}
