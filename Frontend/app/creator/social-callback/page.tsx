"use client"

import Link from "next/link"
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { CheckCircle2, XCircle } from "lucide-react"
import ProtectedRoute from "@/features/auth/components/ProtectedRoute"

// Keys must match the `reason=` codes emitted by backend/src/social_connect/routes.py's
// _callback_redirect calls. Anything unmapped falls back to the generic message below.
const reasonMessages: Record<string, string> = {
  denied: "You declined the connection request.",
  session_mismatch: "This connection link is no longer valid. Please try connecting again.",
  bad_state: "This connection link is no longer valid. Please try connecting again.",
  token_exchange_failed: "We couldn't complete the connection. Please try again.",
  channel_claimed: "That channel is already connected to a different Nepfluence account.",
  no_channel: "That Google account doesn't have a YouTube channel. Create one, then try again.",
  link_failed: "We couldn't finish setting up the connection. Please try again.",
  no_profile: "Complete your creator profile before connecting a social account.",
  not_configured: "This platform isn't available to connect yet.",
  missing_params: "We couldn't complete the connection. Please try again.",
}

function SocialCallbackContent() {
  const searchParams = useSearchParams()
  const platform = searchParams.get("platform") ?? "account"
  const status = searchParams.get("status")
  const reason = searchParams.get("reason")
  const success = status === "success"

  const platformLabel = platform.charAt(0).toUpperCase() + platform.slice(1)

  return (
    <section className="w-full max-w-[480px] rounded-[24px] border border-[#e8e2d9] bg-white p-8 text-center shadow-sm">
      {success ? (
        <>
          <CheckCircle2 className="mx-auto size-12 text-[#10b981]" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-black text-[#1f252b]">{platformLabel} connected</h1>
          <p className="mt-2 text-sm font-medium text-[#69716b]">
            Your {platformLabel} account is now connected to your Nepfluence profile.
          </p>
        </>
      ) : (
        <>
          <XCircle className="mx-auto size-12 text-[#e11d48]" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-black text-[#1f252b]">Couldn&apos;t connect {platformLabel}</h1>
          <p className="mt-2 text-sm font-medium text-[#69716b]">
            {(reason && reasonMessages[reason]) || "Something went wrong. Please try again."}
          </p>
        </>
      )}
      <Link
        className="mt-6 inline-flex h-10 items-center justify-center rounded-full bg-[#1f252b] px-6 text-sm font-black text-white"
        href="/creator/dashboard"
      >
        Back to profile
      </Link>
    </section>
  )
}

export default function SocialCallbackPage() {
  return (
    <ProtectedRoute allowedRoles={["creator"]}>
      <main className="grid min-h-screen place-items-center bg-[#f6f3ed] px-5 py-8">
        <Suspense fallback={<div className="text-sm font-black text-[#1f252b]">Loading...</div>}>
          <SocialCallbackContent />
        </Suspense>
      </main>
    </ProtectedRoute>
  )
}
