"use client"

import { AdminPageShell } from "@/features/admin/components/shell/AdminPageShell"
import { StaffManagementPanel } from "@/features/admin/components/user-management/StaffManagementPanel"

export default function AdminStaffPage() {
  return (
    <AdminPageShell module="staff">
      <StaffManagementPanel />
    </AdminPageShell>
  )
}
