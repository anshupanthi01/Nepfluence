"use client"

import { Send, Trash2 } from "lucide-react"
import { useMarketplaceStore } from "@/features/shared/marketplaceStore"
import { type Collaboration } from "../creator-dashboard.shared"

export function MessagesPanel({
  collaborations,
  messages,
  selectedRoomId,
  message,
  onMessageChange,
  onDeleteConversation,
  onDeleteMessage,
  onRoomChange,
  onSend,
}: {
  collaborations: Collaboration[]
  messages: ReturnType<typeof useMarketplaceStore>["messages"]
  selectedRoomId: number
  message: string
  onMessageChange: (message: string) => void
  onDeleteConversation: (roomId: number) => void
  onDeleteMessage: (messageId: number) => void
  onRoomChange: (roomId: number) => void
  onSend: () => void
}) {
  const directThreads = collaborations.filter((collab, index, list) => {
    const threadKey = `${collab.campaignId}:${collab.brandUserId ?? collab.brand}`
    return list.findIndex((item) => `${item.campaignId}:${item.brandUserId ?? item.brand}` === threadKey) === index
  })
  const activeRoom = directThreads.find((collab) => collab.id === selectedRoomId) ?? directThreads[0]
  const activeThreadKey = activeRoom ? `${activeRoom.campaignId}:${activeRoom.brandUserId ?? activeRoom.brand}` : null
  const activeThreadRoomIds = new Set(
    collaborations
      .filter((collab) => `${collab.campaignId}:${collab.brandUserId ?? collab.brand}` === activeThreadKey)
      .map((collab) => collab.id),
  )
  const roomMessages = messages.filter((item) => {
    if (item.deletedForCreatorAt) return false
    if (activeRoom && item.campaignId && (item.brandUserId || activeRoom.brandUserId)) {
      return item.campaignId === activeRoom.campaignId && (item.brandUserId ?? activeRoom.brandUserId) === activeRoom.brandUserId
    }
    return activeThreadRoomIds.has(item.roomId)
  })

  return (
    <section className="grid min-h-[calc(100vh-112px)] gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="rounded-[28px] border border-[#e8e2d9] bg-[#fbfaf7] p-3 shadow-[0_18px_46px_rgba(31,37,43,0.06)]">
        <div className="px-2 py-3">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8a8175]">Rooms</p>
          <h2 className="mt-1 text-lg font-black tracking-tight text-[#1f252b]">Brand messages</h2>
        </div>
        <div className="space-y-2">
          {directThreads.map((collab) => (
            <button
              key={collab.id}
              className={`flex w-full items-center gap-3 rounded-[20px] p-3 text-left transition ${
                activeRoom?.id === collab.id ? "bg-[#1f252b] text-white shadow-sm" : "bg-white text-[#1f252b] hover:bg-[#f5f3ef]"
              }`}
              type="button"
              onClick={() => onRoomChange(collab.id)}
            >
              <span className={`grid size-10 shrink-0 place-items-center rounded-full text-sm font-black ${activeRoom?.id === collab.id ? "bg-white text-[#1f252b]" : "bg-[#f0ece5] text-[#505852]"}`}>
                {collab.brand.charAt(0)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-black">{collab.brand}</span>
                <span className={`block truncate text-xs font-semibold ${activeRoom?.id === collab.id ? "text-white/64" : "text-[#69716b]"}`}>{collab.campaign}</span>
              </span>
            </button>
          ))}
          {collaborations.length === 0 && (
            <div className="rounded-[20px] border border-dashed border-[#ded8cf] bg-white p-4 text-center">
              <p className="text-sm font-black text-[#1f252b]">No rooms yet</p>
              <p className="mt-2 text-xs font-semibold text-[#69716b]">Messages unlock after a brand accepts your application.</p>
            </div>
          )}
        </div>
      </aside>

      <div className="flex min-h-0 flex-col overflow-hidden rounded-[28px] border border-[#e8e2d9] bg-[#fbfaf7] shadow-[0_18px_46px_rgba(31,37,43,0.06)]">
        <div className="border-b border-[#e8e2d9] px-5 py-4">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8a8175]">Direct message</p>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black tracking-tight text-[#1f252b]">{activeRoom?.brand ?? "Messages"}</h2>
              {activeRoom && <p className="mt-1 text-xs font-semibold text-[#69716b]">{activeRoom.campaign} / {activeRoom.creator} to {activeRoom.brand}</p>}
            </div>
            {activeRoom && (
              <button className="grid size-9 place-items-center rounded-full border border-[#e8caca] bg-white text-[#9f1d1d] transition hover:bg-[#fff0f0]" type="button" aria-label="Delete conversation" onClick={() => onDeleteConversation(activeRoom.id)}>
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>
          <p className="mt-1 text-sm font-semibold text-[#69716b]">{activeRoom?.escrow === "HELD" ? "Escrow is held, so chat and deliverables are open." : "Chat unlocks when escrow is deposited."}</p>
        </div>

        <div className="min-h-[360px] flex-1 space-y-3 overflow-y-auto p-5">
          {roomMessages.map((item) => (
            <div key={item.id} className={item.sender === "creator" ? "ml-auto max-w-md" : "max-w-md"}>
              <div className="mb-1 flex items-center justify-between gap-2 px-1">
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#8a8175]">{item.senderName}</p>
                <button className="grid size-7 place-items-center rounded-full text-[#8a8175] transition hover:bg-[#fff0f0] hover:text-[#9f1d1d]" type="button" aria-label="Delete message" onClick={() => onDeleteMessage(item.id)}>
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </button>
              </div>
              <p className={`rounded-[22px] px-4 py-3 text-sm font-semibold leading-6 shadow-sm ${item.sender === "creator" ? "bg-[#1f252b] text-white" : "bg-white text-[#505852]"}`}>{item.body}</p>
            </div>
          ))}
          {roomMessages.length === 0 && (
            <div className="grid min-h-[300px] place-items-center rounded-[24px] border border-dashed border-[#ded8cf] bg-white/60 p-8 text-center">
              <div>
                <p className="text-lg font-black text-[#1f252b]">No messages yet</p>
                <p className="mt-2 text-sm font-semibold text-[#69716b]">Start with a concise campaign update or delivery question.</p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-[#e8e2d9] bg-white/70 p-4">
          <div className="flex gap-2 rounded-full border border-[#ded8cf] bg-white p-1.5 shadow-sm">
            <input
              className="h-10 min-w-0 flex-1 bg-transparent px-4 text-sm font-semibold text-[#505852] outline-none placeholder:text-[#98a2b3]"
              placeholder="Type a message..."
              value={message}
              onChange={(event) => onMessageChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") onSend()
              }}
            />
            <button className="grid size-10 shrink-0 place-items-center rounded-full bg-[#1f252b] text-white disabled:opacity-50" type="button" aria-label="Send message" disabled={!activeRoom || !message.trim()} onClick={onSend}>
              <Send className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
