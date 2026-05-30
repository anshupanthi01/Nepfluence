import type { AuthSession, UserRole } from "@/features/auth/types/auth.types"

const sessionKey = "nepfluence-session-preview"

export function readMockSession(): AuthSession | null {
  if (typeof window === "undefined") return null

  const rawSession = window.localStorage.getItem(sessionKey)
  return rawSession ? (JSON.parse(rawSession) as AuthSession) : null
}

export function mockLogin(role: UserRole, email = "demo@nepfluence.com") {
  if (typeof window === "undefined") return null

  const session: AuthSession = {
    userId: "preview-user",
    email,
    role,
    accessTokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  }

  window.localStorage.setItem(sessionKey, JSON.stringify(session))
  return session
}

export function mockLogout() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(sessionKey)
}
