"use client"

import { apiClient } from "@/lib/api-client"

export type ConversationCreator = {
  id: number
  user_id: number
  full_name: string
  handle: string | null
}

export type Message = {
  id: number
  conversation_id: number
  sender_user_id: number
  sender_role: string
  sender_name: string
  body: string
  created_at: string
  deleted_for_sender_at: string | null
  deleted_for_recipient_at: string | null
}

export type Conversation = {
  id: number
  campaign_id: number
  brand_profile_id: number
  influencer_profile_id: number
  creator: ConversationCreator
  last_message: Message | null
  created_at: string
  updated_at: string
  hidden_for_brand_at: string | null
  hidden_for_creator_at: string | null
}

export function listConversations(campaignId: number) {
  return apiClient<Conversation[]>(`/campaigns/${campaignId}/conversations`)
}

export function openConversation(campaignId: number, influencerProfileId?: number) {
  return apiClient<Conversation>(`/campaigns/${campaignId}/conversations/open`, {
    method: "POST",
    body: JSON.stringify({ influencer_profile_id: influencerProfileId }),
  })
}

export function listMessages(campaignId: number, conversationId: number) {
  return apiClient<Message[]>(`/campaigns/${campaignId}/conversations/${conversationId}/messages`)
}

export function sendMessage(campaignId: number, conversationId: number, body: string) {
  return apiClient<Message>(`/campaigns/${campaignId}/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ body }),
  })
}

export function hideConversation(campaignId: number, conversationId: number) {
  return apiClient<Conversation>(`/campaigns/${campaignId}/conversations/${conversationId}`, {
    method: "DELETE",
  })
}

export function hideMessage(campaignId: number, conversationId: number, messageId: number) {
  return apiClient<void>(`/campaigns/${campaignId}/conversations/${conversationId}/messages/${messageId}`, {
    method: "DELETE",
  })
}
