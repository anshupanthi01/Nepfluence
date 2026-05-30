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

export function MessagesPanel({
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