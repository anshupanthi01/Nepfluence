"use client"

import { useEffect, useState } from "react"

import { DataTable, type DataTableColumn } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ModalConfirm } from "@/components/ui/modal"
import { listUsers, setUserActive } from "@/features/admin/api/users"
import type { AdminUserListItem, BackendUserRole } from "@/features/admin/types/admin.types"

const PAGE_SIZE = 20

export function UserManagementPanel() {
  const [page, setPage] = useState(1)
  const [role, setRole] = useState<BackendUserRole | "all">("all")
  const [q, setQ] = useState("")
  const [rows, setRows] = useState<AdminUserListItem[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [target, setTarget] = useState<AdminUserListItem | null>(null)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    listUsers({ role: role === "all" ? undefined : role, q: q || undefined, page, page_size: PAGE_SIZE })
      .then((result) => {
        if (cancelled) return
        setRows(result.items)
        setTotal(result.total)
        setError(null)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "Failed to load users")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [role, q, page])

  async function handleConfirm(reason: string) {
    if (!target) return
    const nextActive = !target.is_active
    await setUserActive(target.id, nextActive, reason)
    setRows((prev) => prev.map((row) => (row.id === target.id ? { ...row, is_active: nextActive } : row)))
    setTarget(null)
  }

  const columns: DataTableColumn<AdminUserListItem>[] = [
    { key: "username", header: "Username" },
    { key: "email", header: "Email" },
    {
      key: "role",
      header: "Role",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <StatusBadge label={row.role} tone="info" />
          {row.staff_role && <StatusBadge label={row.staff_role} tone="neutral" />}
        </div>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      render: (row) => (
        <StatusBadge label={row.is_active ? "active" : "suspended"} tone={row.is_active ? "positive" : "negative"} />
      ),
    },
    { key: "date_joined", header: "Joined", render: (row) => new Date(row.date_joined).toLocaleDateString() },
    {
      key: "last_login",
      header: "Last login",
      render: (row) => (row.last_login ? new Date(row.last_login).toLocaleDateString() : "—"),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <Button variant="outline" size="sm" onClick={() => setTarget(row)}>
          {row.is_active ? "Suspend" : "Reactivate"}
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">User & Account Management</h1>
        <p className="text-sm text-muted-foreground">Search, filter, and manage brand and creator accounts.</p>
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Search username or email…"
          value={q}
          onChange={(event) => {
            setPage(1)
            setQ(event.target.value)
          }}
          className="max-w-xs"
        />
        <Select
          value={role}
          onValueChange={(value) => {
            setPage(1)
            setRole(value as BackendUserRole | "all")
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="brand">Brand</SelectItem>
            <SelectItem value="influencer">Influencer</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage="No users found."
      />

      <ModalConfirm
        open={Boolean(target)}
        onOpenChange={(open) => !open && setTarget(null)}
        title={target?.is_active ? `Suspend ${target.username}?` : `Reactivate ${target?.username}?`}
        description="This is logged to the audit trail and takes effect immediately."
        confirmLabel={target?.is_active ? "Suspend" : "Reactivate"}
        destructive={Boolean(target?.is_active)}
        onConfirm={handleConfirm}
      />
    </div>
  )
}
