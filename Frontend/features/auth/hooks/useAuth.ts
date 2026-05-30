"use client"

import { mockLogin, mockLogout, readMockSession } from "@/lib/auth"

export function useAuth() {
  return {
    session: readMockSession(),
    login: mockLogin,
    logout: mockLogout,
  }
}
