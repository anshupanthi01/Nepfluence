"use client"

import { apiClient } from "@/lib/api-client"

export type DiscoveryPlatform = "instagram" | "tiktok" | "youtube"

export type DiscoveryCreator = {
  id: number
  platform: DiscoveryPlatform
  handle: string
  display_name: string | null
  // Real platform CDN avatar. NOTE: these are short-lived signed URLs (~24h) on both IG and
  // TikTok, so they can 403/404 once stale - the UI must fall back to initials on load error.
  avatar_url: string | null
  followers: number | null
  avg_engagement_rate: number | null
  recent_post_avg_views: number | null
  is_verified_badge: boolean
  fake_view_flag: boolean
  provider: string
  last_scraped_at: string
  is_claimed: boolean
}

export function searchDiscoveryCreators(params: {
  platform: DiscoveryPlatform
  query: string
  limit?: number
}) {
  return apiClient<DiscoveryCreator[]>("/api/social-ingest/search", {
    method: "POST",
    body: JSON.stringify({
      platform: params.platform,
      query: params.query,
      limit: params.limit ?? 8,
    }),
  })
}
