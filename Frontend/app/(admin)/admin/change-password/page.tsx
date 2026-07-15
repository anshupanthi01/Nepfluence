"use client"

import ProtectedRoute from "@/features/auth/components/ProtectedRoute"
import { AdminSessionProvider } from "@/features/admin/context/AdminSessionProvider"
import { AdminShell } from "@/features/admin/components/shell/AdminShell"
import { ChangePasswordPanel } from "@/features/admin/components/change-password/ChangePasswordPanel"

export default function AdminChangePasswordPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminSessionProvider>
        <AdminShell>
          <ChangePasswordPanel />
        </AdminShell>
      </AdminSessionProvider>
    </ProtectedRoute>
  )
}
