"use client"

import { apiClient } from "@/lib/api-client"

export function hideConversation(campaignId: number, conversationId: number) {
  return apiClient(`/campaigns/${campaignId}/conversations/${conversationId}`, {
    method: "DELETE",
  })
}

export function hideMessage(campaignId: number, conversationId: number, messageId: number) {
  return apiClient(`/campaigns/${campaignId}/conversations/${conversationId}/messages/${messageId}`, {
    method: "DELETE",
  })
}
