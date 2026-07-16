"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Camera, Music2, Video } from "lucide-react"
import ProtectedRoute from "@/features/auth/components/ProtectedRoute"
import { completeCreatorOnboarding, hasCompletedCreatorOnboarding, readMockSession } from "@/lib/auth"

// Real social-account connecting (OAuth) lives on the profile page - see
// features/creator-profile/api/socialConnectApi.ts and ProfilePanel.tsx. Wiring a 3-way OAuth
// redirect mid-onboarding-wizard (with back/forward state to preserve) is materially more
// complex than pointing here to a dedicated settings flow, for no real benefit - this page is
// now a lightweight welcome step, not a (previously fake, localStorage-only) connector.
function CreatorOnboardingContent() {
  const router = useRouter()

  useEffect(() => {
    const session = readMockSession()
    if (hasCompletedCreatorOnboarding(session?.userId)) {
      router.replace("/creator/dashboard")
    }
  }, [router])

  function finishOnboarding() {
    const session = readMockSession()
    completeCreatorOnboarding(session?.userId)
    router.replace("/creator/dashboard")
  }

  return (
    <main className="grid min-h-screen bg-[#f7f8fa] text-[#090b12] lg:grid-cols-2">
      <section className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-[640px]">
          <h1 className="text-3xl font-black tracking-normal sm:text-4xl">Can we get to know each other?</h1>
          <p className="mt-5 max-w-[520px] text-sm font-medium leading-6 text-[#536071]">
            Welcome to Nepfluence Creator Space. Once you&apos;re in, connect your social
            accounts from your profile to verify your reach and unlock more collaboration
            opportunities.
          </p>

          <div className="mt-8 flex items-center gap-3 rounded-[12px] border border-[#dde2ea] bg-white px-5 py-4">
            <div className="flex -space-x-1">
              <span className="grid size-9 place-items-center rounded-full border-2 border-white bg-[#eef1ff] text-[#0b18ff]">
                <Camera className="size-4" aria-hidden="true" />
              </span>
              <span className="grid size-9 place-items-center rounded-full border-2 border-white bg-[#eef1ff] text-[#0b18ff]">
                <Music2 className="size-4" aria-hidden="true" />
              </span>
              <span className="grid size-9 place-items-center rounded-full border-2 border-white bg-[#eef1ff] text-[#0b18ff]">
                <Video className="size-4" aria-hidden="true" />
              </span>
            </div>
            <p className="text-sm font-medium text-[#536071]">
              Instagram, TikTok and YouTube can be connected from your profile page after signup.
            </p>
          </div>

          <div className="mt-8 flex items-center justify-end">
            <button
              className="inline-flex h-11 min-w-28 items-center justify-center rounded-[8px] bg-[#0b18ff] px-5 text-sm font-black text-white transition"
              type="button"
              onClick={finishOnboarding}
            >
              Continue
            </button>
          </div>
        </div>
      </section>

      <section className="hidden min-h-screen overflow-hidden lg:block">
        <div
          className="h-full w-full bg-cover bg-center"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1520975682031-a7a23d955759?auto=format&fit=crop&w=1400&q=85)",
          }}
        />
      </section>
    </main>
  )
}

export default function CreatorOnboardingPage() {
  return (
    <ProtectedRoute allowedRoles={["creator"]}>
      <CreatorOnboardingContent />
    </ProtectedRoute>
  )
}
