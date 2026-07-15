"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"
import { logout, readMockSession } from "@/lib/auth"
import { useAdminSession } from "@/features/admin/context/AdminSessionProvider"
import { Button } from "@/components/ui/button"
import type { AdminModule } from "@/features/admin/types/admin.types"

const NAV_ITEMS: { module: AdminModule; label: string; href: string }[] = [
  { module: "users", label: "Users", href: "/admin/users" },
  { module: "staff", label: "Staff", href: "/admin/staff" },
  { module: "campaigns", label: "Campaigns", href: "/admin/campaigns" },
  { module: "escrow", label: "Escrow", href: "/admin/escrow" },
  { module: "audit_log", label: "Audit Log", href: "/admin/audit-log" },
]

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { staffRole, allowedModules, isLoading } = useAdminSession()
  const session = readMockSession()

  const visibleItems = NAV_ITEMS.filter((item) => allowedModules.includes(item.module))

  function handleLogout() {
    logout()
    router.replace("/admin-login")
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-muted/20">
        <div className="border-b border-border px-4 py-4">
          <p className="text-sm font-bold tracking-tight">Nepfluence Admin</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {isLoading ? "Loading role…" : staffRole ? staffRole.replaceAll("_", " ") : "No role"}
          </p>
        </div>
        <nav className="flex-1 space-y-0.5 p-2">
          {visibleItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-border p-2">
          <p className="truncate px-2.5 py-1 text-xs text-muted-foreground">{session?.email}</p>
          <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-auto p-6">{children}</main>
    </div>
  )
}
