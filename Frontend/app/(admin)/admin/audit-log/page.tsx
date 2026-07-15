"use client"

import { AdminPageShell } from "@/features/admin/components/shell/AdminPageShell"
import { AuditLogPanel } from "@/features/admin/components/audit-log/AuditLogPanel"

export default function AdminAuditLogPage() {
  return (
    <AdminPageShell module="audit_log">
      <AuditLogPanel />
    </AdminPageShell>
  )
}
