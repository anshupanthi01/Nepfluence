"use client"

import { useEffect, useMemo, useSyncExternalStore } from "react"
import { usePathname, useRouter } from "next/navigation"
import type { AuthSession, UserRole } from "@/features/auth/types/auth.types"

type ProtectedRouteProps = {
  allowedRoles: UserRole[]
  children: React.ReactNode
}

const sessionKey = "nepfluence-session"
const pendingSessionSnapshot = "__nepfluence_pending_session__"

function defaultDashboard(role: UserRole) {
  if (role === "admin") return "/admin/dashboard"
  return role === "creator" ? "/creator/dashboard" : "/dashboard"
}

function subscribeToSession(callback: () => void) {
  if (typeof window === "undefined") return () => {}

  window.addEventListener("storage", callback)
  window.addEventListener("nepfluence-session-updated", callback)
  return () => {
    window.removeEventListener("storage", callback)
    window.removeEventListener("nepfluence-session-updated", callback)
  }
}

function readSessionSnapshot() {
  if (typeof window === "undefined") return pendingSessionSnapshot
  return window.localStorage.getItem(sessionKey) ?? ""
}

function readServerSessionSnapshot() {
  return pendingSessionSnapshot
}

function parseValidSession(snapshot: string) {
  if (!snapshot || snapshot === pendingSessionSnapshot) return null

  try {
    const session = JSON.parse(snapshot) as AuthSession
    if (!session.accessToken) return null
    if (Date.parse(session.accessTokenExpiresAt) <= Date.now()) return null

    return session
  } catch {
    return null
  }
}

export default function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const router = useRouter()
  const pathname = usePathname()
  const sessionSnapshot = useSyncExternalStore(subscribeToSession, readSessionSnapshot, readServerSessionSnapshot)
  const session = useMemo(() => parseValidSession(sessionSnapshot), [sessionSnapshot])
  const isCheckingSession = sessionSnapshot === pendingSessionSnapshot
  const isAllowed = Boolean(session && allowedRoles.includes(session.role))

  useEffect(() => {
    if (isCheckingSession) return

    if (!session) {
      if (pathname.startsWith("/admin")) {
        router.replace("/admin-login")
        return
      }
      const role = pathname.startsWith("/creator") ? "creator" : "brand"
      router.replace(`/login?role=${role}`)
      return
    }

    if (!allowedRoles.includes(session.role)) {
      router.replace(defaultDashboard(session.role))
    }
  }, [allowedRoles, isCheckingSession, pathname, router, session])

  if (isCheckingSession || !isAllowed) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f8f7ff] px-6 text-center text-[#241655]">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#6e70ee]">Checking access</p>
      </main>
    )
  }

  return children
}