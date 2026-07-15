"use client"

import { useEffect, useState } from "react"

import { DataTable, type DataTableColumn } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Modal } from "@/components/ui/modal"
import { Textarea } from "@/components/ui/textarea"
import { createStaff, listStaff, updateStaff } from "@/features/admin/api/staff"
import type { AdminStaffListItem, AdminStaffRole } from "@/features/admin/types/admin.types"

const PAGE_SIZE = 20
const STAFF_ROLES: AdminStaffRole[] = ["super_admin", "finance_ops", "support", "content_moderator", "analyst"]

const EMPTY_FORM = { username: "", email: "", password: "", staff_role: "support" as AdminStaffRole }

export function StaffManagementPanel() {
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<AdminStaffListItem[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [target, setTarget] = useState<AdminStaffListItem | null>(null)
  const [editRole, setEditRole] = useState<AdminStaffRole>("support")
  const [editActive, setEditActive] = useState<"active" | "inactive">("active")
  const [editReason, setEditReason] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  function refresh() {
    setIsLoading(true)
    listStaff({ page, page_size: PAGE_SIZE })
      .then((result) => {
        setRows(result.items)
        setTotal(result.total)
        setError(null)
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load staff"))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  async function handleCreate() {
    setIsSubmitting(true)
    setFormError(null)
    try {
      await createStaff(form)
      setCreateOpen(false)
      setForm(EMPTY_FORM)
      refresh()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create staff account")
    } finally {
      setIsSubmitting(false)
    }
  }

  function openEdit(row: AdminStaffListItem) {
    setTarget(row)
    setEditRole(row.staff_role)
    setEditActive(row.is_active ? "active" : "inactive")
    setEditReason("")
    setEditError(null)
  }

  async function handleSaveEdit() {
    if (!target || !editReason.trim()) return
    setIsSaving(true)
    setEditError(null)
    try {
      await updateStaff(target.admin_profile_id, {
        staff_role: editRole,
        is_active: editActive === "active",
        reason: editReason,
      })
      setTarget(null)
      refresh()
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to update staff account")
    } finally {
      setIsSaving(false)
    }
  }

  const columns: DataTableColumn<AdminStaffListItem>[] = [
    { key: "username", header: "Username" },
    { key: "email", header: "Email" },
    {
      key: "staff_role",
      header: "Role",
      render: (row) => <StatusBadge label={row.staff_role} tone="info" />,
    },
    {
      key: "is_active",
      header: "Status",
      render: (row) => (
        <StatusBadge label={row.is_active ? "active" : "inactive"} tone={row.is_active ? "positive" : "negative"} />
      ),
    },
    { key: "created_at", header: "Created", render: (row) => new Date(row.created_at).toLocaleDateString() },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <Button variant="outline" size="sm" onClick={() => openEdit(row)}>
          Edit
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Staff & Permissions</h1>
          <p className="text-sm text-muted-foreground">Manage internal admin staff accounts and roles.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>Add staff</Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.admin_profile_id}
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage="No staff accounts yet."
      />

      <Modal
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open) setFormError(null)
        }}
        title="Add staff account"
        description="Creates a new internal admin login. Share the temporary password securely — they'll be forced to change it on first login."
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isSubmitting || !form.username || !form.email || form.password.length < 8}
            >
              Create
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <Input
            placeholder="Username"
            value={form.username}
            onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
          />
          <Input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          />
          <Input
            placeholder="Temporary password (min. 8 characters)"
            type="password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          />
          <Select
            value={form.staff_role}
            onValueChange={(value) => setForm((prev) => ({ ...prev, staff_role: value as AdminStaffRole }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAFF_ROLES.map((option) => (
                <SelectItem key={option} value={option}>
                  {option.replaceAll("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Modal>

      <Modal
        open={Boolean(target)}
        onOpenChange={(open) => !open && setTarget(null)}
        title={`Edit ${target?.username ?? ""}`}
        description="Role and access changes take effect immediately and are recorded to the audit log."
        footer={
          <>
            <Button variant="outline" onClick={() => setTarget(null)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving || !editReason.trim()}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {editError && <p className="text-sm text-destructive">{editError}</p>}
          <Select value={editRole} onValueChange={(value) => setEditRole(value as AdminStaffRole)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAFF_ROLES.map((option) => (
                <SelectItem key={option} value={option}>
                  {option.replaceAll("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={editActive} onValueChange={(value) => setEditActive(value as "active" | "inactive")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive (blocks login and all API access immediately)</SelectItem>
            </SelectContent>
          </Select>
          <Textarea
            placeholder="Reason (required, recorded to the audit log)"
            value={editReason}
            onChange={(event) => setEditReason(event.target.value)}
            rows={3}
          />
        </div>
      </Modal>
    </div>
  )
}
