"use client"

import { AdminPageShell } from "@/features/admin/components/shell/AdminPageShell"
import { UserManagementPanel } from "@/features/admin/components/user-management/UserManagementPanel"

export default function AdminUsersPage() {
  return (
    <AdminPageShell module="users">
      <UserManagementPanel />
    </AdminPageShell>
  )
}
