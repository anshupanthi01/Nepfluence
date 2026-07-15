"use client"

import { useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

import ProtectedRoute from "@/features/auth/components/ProtectedRoute"
import { AdminSessionProvider, useAdminSession } from "@/features/admin/context/AdminSessionProvider"
import { AdminShell } from "@/features/admin/components/shell/AdminShell"
import type { AdminModule } from "@/features/admin/types/admin.types"

function Gate({ module, children }: { module?: AdminModule; children: ReactNode }) {
  const router = useRouter()
  const { isLoading, error, canAccess, mustChangePassword } = useAdminSession()

  useEffect(() => {
    if (!isLoading && mustChangePassword) {
      router.replace("/admin/change-password")
    }
  }, [isLoading, mustChangePassword, router])

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>
  }
  if (error) {
    return <div className="p-6 text-sm text-destructive">{error}</div>
  }
  if (mustChangePassword) {
    return <div className="p-6 text-sm text-muted-foreground">Redirecting to change your password…</div>
  }
  if (module && !canAccess(module)) {
    return (
      <div className="p-6">
        <p className="text-sm font-semibold text-destructive">Access denied</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Your role does not have permission to view this module.
        </p>
      </div>
    )
  }
  return <>{children}</>
}

export function AdminPageShell({ module, children }: { module?: AdminModule; children: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminSessionProvider>
        <AdminShell>
          <Gate module={module}>{children}</Gate>
        </AdminShell>
      </AdminSessionProvider>
    </ProtectedRoute>
  )
}
