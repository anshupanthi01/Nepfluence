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
  type Activity,
  type Collaboration,
  type CreatorCampaign,
  creatorAnalytics,
  creatorProfileImage,
  portfolioShots,
  campaignImage,
  money,
  statusClass,
} from "../creator-dashboard.shared"

import { InfoCard } from "./InfoCard"
import { MiniStat } from "./MiniStat"
export function ProfilePanel() {
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