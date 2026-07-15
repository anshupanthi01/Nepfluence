"use client"

import { Send, Trash2, X } from "lucide-react"
import { useState } from "react"
import type { Conversation, Message } from "@/features/conversations/api/conversationApi"
import { useEscapeKey } from "@/hooks/useEscapeKey"

export type CreatorConversation = Conversation & { campaignTitle: string; brandName: string }

export function MessagesPanel({
  conversations,
  messages,
  selectedConversationId,
  message,
  onMessageChange,
  onDeleteConversation,
  onDeleteMessages,
  onRoomChange,
  onSend,
}: {
  conversations: CreatorConversation[]
  messages: Message[]
  selectedConversationId: number | null
  message: string
  onMessageChange: (message: string) => void
  onDeleteConversation: (conversationId: number) => void
  onDeleteMessages: (messageIds: number[]) => void
  onRoomChange: (conversationId: number) => void
  onSend: () => void
}) {
  const [selectedMessageIds, setSelectedMessageIds] = useState<number[]>([])
  const [pendingDeleteIds, setPendingDeleteIds] = useState<number[]>([])
  const activeConversation = conversations.find((conversation) => conversation.id === selectedConversationId) ?? conversations[0]
  const roomMessages = messages
  const ownMessages = roomMessages.filter((item) => item.sender_role === "influencer")
  const selectedInRoom = selectedMessageIds.filter((id) => ownMessages.some((item) => item.id === id))
  const allSelected = ownMessages.length > 0 && selectedInRoom.length === ownMessages.length

  function toggleMessageSelection(messageId: number) {
    setSelectedMessageIds((current) =>
      current.includes(messageId) ? current.filter((id) => id !== messageId) : [...current, messageId],
    )
  }

  function toggleAllMessages() {
    setSelectedMessageIds((current) => {
      const roomIds = ownMessages.map((item) => item.id)
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
    <section className="grid min-h-[calc(100vh-112px)] gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="rounded-[28px] border border-[#e8e2d9] bg-[#fbfaf7] p-3 shadow-[0_18px_46px_rgba(31,37,43,0.06)]">
        <div className="px-2 py-3">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8a8175]">Rooms</p>
          <h2 className="mt-1 text-lg font-black tracking-tight text-[#1f252b]">Brand messages</h2>
        </div>
        <div className="space-y-2">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              className={`flex w-full items-center gap-3 rounded-[20px] p-3 text-left transition ${
                activeConversation?.id === conversation.id ? "bg-[#1f252b] text-white shadow-sm" : "bg-white text-[#1f252b] hover:bg-[#f5f3ef]"
              }`}
              type="button"
              onClick={() => onRoomChange(conversation.id)}
            >
              <span className={`grid size-10 shrink-0 place-items-center rounded-full text-sm font-black ${activeConversation?.id === conversation.id ? "bg-white text-[#1f252b]" : "bg-[#f0ece5] text-[#505852]"}`}>
                {conversation.brandName.charAt(0)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-black">{conversation.brandName}</span>
                <span className={`block truncate text-xs font-semibold ${activeConversation?.id === conversation.id ? "text-white/64" : "text-[#69716b]"}`}>{conversation.campaignTitle}</span>
              </span>
            </button>
          ))}
          {conversations.length === 0 && (
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
              <h2 className="text-xl font-black tracking-tight text-[#1f252b]">{activeConversation?.brandName ?? "Messages"}</h2>
              {activeConversation && <p className="mt-1 text-xs font-semibold text-[#69716b]">{activeConversation.campaignTitle}</p>}
            </div>
            {activeConversation && (
              <button className="grid size-9 place-items-center rounded-full border border-[#e8caca] bg-white text-[#9f1d1d] transition hover:bg-[#fff0f0]" type="button" aria-label="Delete conversation" onClick={() => onDeleteConversation(activeConversation.id)}>
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>
          {ownMessages.length > 0 && (
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
        </div>

        <div className="min-h-[360px] flex-1 space-y-3 overflow-y-auto p-5">
          {roomMessages.map((item) => {
            const isOwnMessage = item.sender_role === "influencer"
            return (
            <div key={item.id} className={isOwnMessage ? "ml-auto max-w-md" : "max-w-md"}>
              <div className="mb-1 flex items-center justify-between gap-2 px-1">
                <label className="flex min-w-0 items-center gap-2 text-[11px] font-black uppercase tracking-[0.12em] text-[#8a8175]">
                  {isOwnMessage && (
                    <input className="size-4 accent-[#1f252b]" type="checkbox" checked={selectedMessageIds.includes(item.id)} onChange={() => toggleMessageSelection(item.id)} />
                  )}
                  <span className="truncate">{item.sender_name}</span>
                </label>
                {isOwnMessage && (
                  <button className="grid size-7 place-items-center rounded-full text-[#8a8175] transition hover:bg-[#fff0f0] hover:text-[#9f1d1d]" type="button" aria-label="Delete message" onClick={() => confirmDelete([item.id])}>
                    <Trash2 className="size-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
              <p className={`rounded-[22px] px-4 py-3 text-sm font-semibold leading-6 shadow-sm ${isOwnMessage ? "bg-[#1f252b] text-white" : "bg-white text-[#505852]"}`}>{item.body}</p>
            </div>
          )})}
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
            <button className="grid size-10 shrink-0 place-items-center rounded-full bg-[#1f252b] text-white disabled:opacity-50" type="button" aria-label="Send message" disabled={!activeConversation || !message.trim()} onClick={onSend}>
              <Send className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
      {pendingDeleteIds.length > 0 && (
        <ConfirmDeleteDialog pendingDeleteIds={pendingDeleteIds} onCancel={() => setPendingDeleteIds([])} onConfirm={deletePendingMessages} />
      )}
    </section>
  )
}

function ConfirmDeleteDialog({
  pendingDeleteIds,
  onCancel,
  onConfirm,
}: {
  pendingDeleteIds: number[]
  onCancel: () => void
  onConfirm: () => void
}) {
  useEscapeKey(true, onCancel)

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#1f252b]/35 p-4 backdrop-blur-sm" onClick={onCancel}>
      <div className="w-full max-w-md rounded-[16px] border border-[#e8e2d9] bg-[#fbfaf7] p-5 shadow-[0_24px_80px_rgba(31,37,43,0.2)]" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8a8175]">Confirm delete</p>
            <h3 className="mt-1 text-lg font-black text-[#1f252b]">Delete {pendingDeleteIds.length} message{pendingDeleteIds.length === 1 ? "" : "s"} permanently?</h3>
          </div>
          <button className="grid size-8 place-items-center rounded-full border border-[#ded8cf] bg-white text-[#69716b]" type="button" aria-label="Cancel delete" onClick={onCancel}>
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <p className="mt-3 text-sm font-semibold leading-6 text-[#69716b]">This removes the selected message{pendingDeleteIds.length === 1 ? "" : "s"} from this conversation for both sides.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="h-9 rounded-full border border-[#ded8cf] bg-white px-4 text-xs font-black text-[#505852]" type="button" onClick={onCancel}>Cancel</button>
          <button className="h-9 rounded-full bg-[#9f1d1d] px-4 text-xs font-black text-white" type="button" onClick={onConfirm}>Delete permanently</button>
        </div>
      </div>
    </div>
  )
}
