"use client"

import Link from "next/link"

import { AdminPageShell } from "@/features/admin/components/shell/AdminPageShell"
import { useAdminSession } from "@/features/admin/context/AdminSessionProvider"
import type { AdminModule } from "@/features/admin/types/admin.types"

const TILES: { module: AdminModule; label: string; href: string; description: string }[] = [
  { module: "users", label: "Users", href: "/admin/users", description: "Search and manage brand/creator accounts." },
  { module: "staff", label: "Staff", href: "/admin/staff", description: "Manage internal admin staff and roles." },
  {
    module: "campaigns",
    label: "Campaigns",
    href: "/admin/campaigns",
    description: "Oversee campaigns across all brands.",
  },
  {
    module: "escrow",
    label: "Escrow",
    href: "/admin/escrow",
    description: "Ledger, payout queue, and manual interventions.",
  },
]

function DashboardHome() {
  const { allowedModules } = useAdminSession()
  const tiles = TILES.filter((tile) => allowedModules.includes(tile.module))

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">Welcome</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className="rounded-lg border border-border p-4 transition-colors hover:bg-muted/40"
          >
            <p className="font-semibold">{tile.label}</p>
            <p className="mt-1 text-sm text-muted-foreground">{tile.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  return (
    <AdminPageShell>
      <DashboardHome />
    </AdminPageShell>
  )
}
