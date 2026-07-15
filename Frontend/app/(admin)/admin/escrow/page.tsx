"use client"

import { AdminPageShell } from "@/features/admin/components/shell/AdminPageShell"
import { EscrowConsolePanel } from "@/features/admin/components/escrow-console/EscrowConsolePanel"

export default function AdminEscrowPage() {
  return (
    <AdminPageShell module="escrow">
      <EscrowConsolePanel />
    </AdminPageShell>
  )
}
