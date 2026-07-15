"use client"

import { AdminPageShell } from "@/features/admin/components/shell/AdminPageShell"
import { CampaignOversightPanel } from "@/features/admin/components/campaign-oversight/CampaignOversightPanel"

export default function AdminCampaignsPage() {
  return (
    <AdminPageShell module="campaigns">
      <CampaignOversightPanel />
    </AdminPageShell>
  )
}
