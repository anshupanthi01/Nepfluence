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
  type Activity,
  type Creator,
  creatorAnalytics,
  creatorImage,
  creatorWorkSamples,
  campaignImage,
  money,
  statusClass,
} from "../brand-dashboard.shared"

import { MiniReviewStat } from "./ReviewStats"
export function CollaborationsPanel({
  collaborations,
  onDeposit,
  onApprove,
}: {
  collaborations: Collaboration[]
  onDeposit: (id: number) => void
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