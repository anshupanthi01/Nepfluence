"use client"

import { Send, Trash2, X } from "lucide-react"
import { useState } from "react"
import type { MarketplaceCollaboration as Collaboration, useMarketplaceStore } from "@/features/shared/marketplaceStore"

export function MessagesPanel({
  collaborations,
  messages,
  selectedRoomId,
  message,
  onMessageChange,
  onDeleteConversation,
  onDeleteMessages,
  onRoomChange,
  onSend,
}: {
  collaborations: Collaboration[]
  messages: ReturnType<typeof useMarketplaceStore>["messages"]
  selectedRoomId: number
  message: string
  onMessageChange: (message: string) => void
  onDeleteConversation: (roomId: number) => void
  onDeleteMessages: (messageIds: number[]) => void
  onRoomChange: (roomId: number) => void
  onSend: () => void
}) {
  const [selectedMessageIds, setSelectedMessageIds] = useState<number[]>([])
  const [pendingDeleteIds, setPendingDeleteIds] = useState<number[]>([])
  const directThreads = collaborations.filter((collab, index, list) => {
    const threadKey = `${collab.campaignId}:${collab.creatorUserId ?? collab.creator}`
    return list.findIndex((item) => `${item.campaignId}:${item.creatorUserId ?? item.creator}` === threadKey) === index
  })
  const activeRoom = directThreads.find((collab) => collab.id === selectedRoomId) ?? directThreads[0]
  const activeThreadKey = activeRoom ? `${activeRoom.campaignId}:${activeRoom.creatorUserId ?? activeRoom.creator}` : null
  const activeThreadRoomIds = new Set(
    collaborations
      .filter((collab) => `${collab.campaignId}:${collab.creatorUserId ?? collab.creator}` === activeThreadKey)
      .map((collab) => collab.id),
  )
  const roomMessages = messages.filter((item) => {
    if (item.deletedForBrandAt) return false
    if (activeRoom && item.campaignId && (item.creatorUserId || activeRoom.creatorUserId)) {
      return item.campaignId === activeRoom.campaignId && (item.creatorUserId ?? activeRoom.creatorUserId) === activeRoom.creatorUserId
    }
    return activeThreadRoomIds.has(item.roomId)
  })
  const selectedInRoom = selectedMessageIds.filter((id) => roomMessages.some((item) => item.id === id))
  const allSelected = roomMessages.length > 0 && selectedInRoom.length === roomMessages.length
  const threadsByCampaign = directThreads.reduce<Record<string, Collaboration[]>>((groups, collab) => {
    groups[collab.campaign] = [...(groups[collab.campaign] ?? []), collab]
    return groups
  }, {})

  function toggleMessageSelection(messageId: number) {
    setSelectedMessageIds((current) =>
      current.includes(messageId) ? current.filter((id) => id !== messageId) : [...current, messageId],
    )
  }

  function toggleAllMessages() {
    setSelectedMessageIds((current) => {
      const roomIds = roomMessages.map((item) => item.id)
      if (roomIds.every((id) => current.includes(id))) {
        return current.filter((id) => !roomIds.includes(id))
      }
      return Array.from(new Set([...current, ...roomIds]))
    })
  }

  function confirmDelete(messageIds: number[]) {
    setPendingDeleteIds(messageIds)
  }

  function deletePendingMessages() {
    onDeleteMessages(pendingDeleteIds)
    setSelectedMessageIds((current) => current.filter((id) => !pendingDeleteIds.includes(id)))
    setPendingDeleteIds([])
  }

  return (
    <section className="grid min-h-[620px] gap-4 lg:grid-cols-[300px_1fr]">
      <aside className="rounded-[24px] border border-[#e8e2d9] bg-[#fbfaf7] p-3 shadow-sm">
        <div className="px-2 py-3">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8a8175]">Inbox</p>
          <h2 className="mt-1 text-lg font-black text-[#1f252b]">Messages</h2>
        </div>
        <div className="space-y-2">
          {Object.entries(threadsByCampaign).map(([campaign, threads]) => (
            <div key={campaign} className="rounded-[18px] bg-white/55 p-2">
              <p className="px-2 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#8a8175]">{campaign}</p>
              <div className="mt-1 space-y-1">
                {threads.map((collab) => (
                  <button key={collab.id} className={`flex w-full items-center gap-3 rounded-[16px] p-3 text-left transition ${activeRoom?.id === collab.id ? "bg-white shadow-sm ring-1 ring-[#e8e2d9]" : "hover:bg-white/70"}`} type="button" onClick={() => onRoomChange(collab.id)}>
                    <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#1f252b] text-xs font-black text-white">{collab.creator.charAt(0)}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-[#1f252b]">{collab.creator}</span>
                      <span className="block truncate text-xs font-semibold text-[#69716b]">Private thread</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          {collaborations.length === 0 && (
            <div className="rounded-[18px] border border-dashed border-[#ded8cf] bg-white p-4 text-center">
              <p className="text-sm font-black text-[#1f252b]">No rooms yet</p>
              <p className="mt-2 text-xs font-semibold text-[#69716b]">Collaboration messages appear after a creator is accepted.</p>
            </div>
          )}
        </div>
      </aside>

      <div className="flex min-h-0 flex-col overflow-hidden rounded-[24px] border border-[#e8e2d9] bg-[#fbfaf7] shadow-sm">
        <header className="border-b border-[#e8e2d9] p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8a8175]">Direct message</p>
              <h2 className="mt-1 text-xl font-black text-[#1f252b]">{activeRoom?.creator ?? "Messages"}</h2>
              {activeRoom && <p className="mt-1 text-xs font-semibold text-[#69716b]">{activeRoom.campaign} / {activeRoom.brand} to {activeRoom.creator}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-fit rounded-full bg-[#f0ece5] px-3 py-1 text-xs font-black text-[#505852]">
                {activeRoom?.escrow === "HELD" ? "Escrow held" : "Escrow pending"}
              </span>
              {activeRoom && (
                <button className="grid size-9 place-items-center rounded-full border border-[#e8caca] bg-white text-[#9f1d1d] transition hover:bg-[#fff0f0]" type="button" aria-label="Delete conversation" onClick={() => onDeleteConversation(activeRoom.id)}>
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
          {roomMessages.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button className="h-8 rounded-full border border-[#ded8cf] bg-white px-3 text-xs font-black text-[#505852]" type="button" onClick={toggleAllMessages}>
                {allSelected ? "Clear selection" : "Select all"}
              </button>
              {selectedInRoom.length > 0 && (
                <button className="inline-flex h-8 items-center gap-2 rounded-full bg-[#9f1d1d] px-3 text-xs font-black text-white" type="button" onClick={() => confirmDelete(selectedInRoom)}>
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  Delete selected ({selectedInRoom.length})
                </button>
              )}
            </div>
          )}
        </header>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
          {roomMessages.map((item) => (
            <div key={item.id} className={item.sender === "brand" ? "ml-auto max-w-md" : "max-w-md"}>
              <div className="mb-1 flex items-center justify-between gap-2 px-1">
                <label className="flex min-w-0 items-center gap-2 text-[11px] font-black uppercase tracking-[0.1em] text-[#8a8175]">
                  <input className="size-4 accent-[#1f252b]" type="checkbox" checked={selectedMessageIds.includes(item.id)} onChange={() => toggleMessageSelection(item.id)} />
                  <span className="truncate">{item.senderName}</span>
                </label>
                <button className="grid size-7 place-items-center rounded-full text-[#8a8175] transition hover:bg-[#fff0f0] hover:text-[#9f1d1d]" type="button" aria-label="Delete message" onClick={() => confirmDelete([item.id])}>
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </button>
              </div>
              <p className={`rounded-[20px] px-4 py-3 text-sm font-semibold leading-6 ${item.sender === "brand" ? "bg-[#1f252b] text-white" : "bg-white text-[#505852] ring-1 ring-[#e8e2d9]"}`}>{item.body}</p>
            </div>
          ))}
          {roomMessages.length === 0 && (
            <div className="grid min-h-72 place-items-center rounded-[22px] border border-dashed border-[#ded8cf] bg-white/60 p-8 text-center">
              <div>
                <p className="text-sm font-black text-[#1f252b]">No messages yet</p>
                <p className="mt-2 text-xs font-semibold text-[#69716b]">Send the first collaboration update when escrow is ready.</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 border-t border-[#e8e2d9] bg-white/70 p-4">
          <input
            className="h-11 flex-1 rounded-full border border-[#ded8cf] bg-white px-4 text-sm font-semibold outline-none transition focus:border-[#1f252b] focus:ring-4 focus:ring-[#1f252b]/8"
            placeholder="Type a message..."
            value={message}
            onChange={(event) => onMessageChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onSend()
            }}
          />
          <button className="grid size-11 place-items-center rounded-full bg-[#1f252b] text-white transition hover:bg-[#303840] disabled:opacity-50" type="button" aria-label="Send message" disabled={!activeRoom || !message.trim()} onClick={onSend}>
            <Send className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      {pendingDeleteIds.length > 0 && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#1f252b]/35 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[16px] border border-[#e8e2d9] bg-[#fbfaf7] p-5 shadow-[0_24px_80px_rgba(31,37,43,0.2)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8a8175]">Confirm delete</p>
                <h3 className="mt-1 text-lg font-black text-[#1f252b]">Delete {pendingDeleteIds.length} message{pendingDeleteIds.length === 1 ? "" : "s"} permanently?</h3>
              </div>
              <button className="grid size-8 place-items-center rounded-full border border-[#ded8cf] bg-white text-[#69716b]" type="button" aria-label="Cancel delete" onClick={() => setPendingDeleteIds([])}>
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
            <p className="mt-3 text-sm font-semibold leading-6 text-[#69716b]">This removes the selected message{pendingDeleteIds.length === 1 ? "" : "s"} from this conversation for both sides.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button className="h-9 rounded-full border border-[#ded8cf] bg-white px-4 text-xs font-black text-[#505852]" type="button" onClick={() => setPendingDeleteIds([])}>Cancel</button>
              <button className="h-9 rounded-full bg-[#9f1d1d] px-4 text-xs font-black text-white" type="button" onClick={deletePendingMessages}>Delete permanently</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
