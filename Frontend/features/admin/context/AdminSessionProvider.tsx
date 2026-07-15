"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

import { getAdminMe } from "@/features/admin/api/session"
import type { AdminModule, AdminStaffRole } from "@/features/admin/types/admin.types"

type AdminSessionContextValue = {
  staffRole: AdminStaffRole | null
  allowedModules: AdminModule[]
  mustChangePassword: boolean
  isLoading: boolean
  error: string | null
  canAccess: (module: AdminModule) => boolean
}

const AdminSessionContext = createContext<AdminSessionContextValue>({
  staffRole: null,
  allowedModules: [],
  mustChangePassword: false,
  isLoading: true,
  error: null,
  canAccess: () => false,
})

export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [staffRole, setStaffRole] = useState<AdminStaffRole | null>(null)
  const [allowedModules, setAllowedModules] = useState<AdminModule[]>([])
  const [mustChangePassword, setMustChangePassword] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    getAdminMe()
      .then((me) => {
        if (cancelled) return
        setStaffRole(me.staff_role)
        setAllowedModules(me.allowed_modules)
        setMustChangePassword(me.must_change_password)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "Failed to load admin session")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const value: AdminSessionContextValue = {
    staffRole,
    allowedModules,
    mustChangePassword,
    isLoading,
    error,
    canAccess: (module) => allowedModules.includes(module),
  }

  return <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>
}

export function useAdminSession() {
  return useContext(AdminSessionContext)
}
