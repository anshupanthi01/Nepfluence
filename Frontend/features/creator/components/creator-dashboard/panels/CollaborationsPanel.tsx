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

export function CollaborationsPanel({
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