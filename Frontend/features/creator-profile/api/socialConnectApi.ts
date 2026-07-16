"use client"

import { apiClient } from "@/lib/api-client"

export type ConnectPlatform = "instagram" | "youtube" | "tiktok"

export type ConnectedAccount = {
  platform: ConnectPlatform
  platform_handle: string | null
  connected_at: string
}

// credentials: "include" is required here - the backend's CSRF defense for this flow binds
// the OAuth `state` to a nonce stored in a session cookie set on THIS response. Without it,
// the browser never stores that cookie and every connect attempt fails as a session mismatch.
// See backend/src/social_connect/routes.py's module docstring for the full mechanism.
export function startSocialConnect(platform: ConnectPlatform) {
  return apiClient<{ authorize_url: string }>(`/social-connect/${platform}/start`, {
    method: "POST",
    credentials: "include",
  })
}

export function listConnectedAccounts() {
  return apiClient<ConnectedAccount[]>("/social-connect/me")
}
