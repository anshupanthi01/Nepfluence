"use client"

import { useEffect, useState } from "react"

import { DataTable, type DataTableColumn } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Modal } from "@/components/ui/modal"
import { listAuditLog } from "@/features/admin/api/auditLog"
import type { AdminAuditLogEntry, AdminModule } from "@/features/admin/types/admin.types"

const PAGE_SIZE = 20

const MODULE_OPTIONS: AdminModule[] = [
  "users",
  "staff",
  "campaigns",
  "escrow",
  "analytics",
  "disputes",
  "moderation",
  "settings",
  "audit_log",
]

export function AuditLogPanel() {
  const [page, setPage] = useState(1)
  const [module, setModule] = useState<AdminModule | "all">("all")
  const [action, setAction] = useState("")
  const [rows, setRows] = useState<AdminAuditLogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [detail, setDetail] = useState<AdminAuditLogEntry | null>(null)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    listAuditLog({ module: module === "all" ? undefined : module, action: action || undefined, page, page_size: PAGE_SIZE })
      .then((result) => {
        if (cancelled) return
        setRows(result.items)
        setTotal(result.total)
        setError(null)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "Failed to load audit log")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [module, action, page])

  const columns: DataTableColumn<AdminAuditLogEntry>[] = [
    { key: "created_at", header: "When", render: (row) => new Date(row.created_at).toLocaleString() },
    { key: "actor_username", header: "Actor" },
    { key: "module", header: "Module" },
    { key: "action", header: "Action" },
    {
      key: "target",
      header: "Target",
      render: (row) => `${row.target_type} #${row.target_id}`,
    },
    { key: "reason", header: "Reason", render: (row) => row.reason ?? "—" },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <Button variant="outline" size="sm" onClick={() => setDetail(row)}>
          View
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Audit Log</h1>
        <p className="text-sm text-muted-foreground">
          Read-only record of every mutating admin action — actor, timestamp, before/after state, and reason.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Search action…"
          value={action}
          onChange={(event) => {
            setPage(1)
            setAction(event.target.value)
          }}
          className="max-w-xs"
        />
        <Select
          value={module}
          onValueChange={(value) => {
            setPage(1)
            setModule(value as AdminModule | "all")
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Module" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All modules</SelectItem>
            {MODULE_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option.replaceAll("_", " ")}
              </SelectItem>
            ))}
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
        emptyMessage="No audit log entries yet."
      />

      <Modal
        open={Boolean(detail)}
        onOpenChange={(open) => !open && setDetail(null)}
        title={detail ? `${detail.action}` : ""}
        description={detail ? `${detail.actor_username} · ${new Date(detail.created_at).toLocaleString()}` : undefined}
        className="max-w-lg"
      >
        {detail && (
          <div className="space-y-3 text-xs">
            <p>
              <span className="font-semibold">Target:</span> {detail.target_type} #{detail.target_id}
            </p>
            <p>
              <span className="font-semibold">Reason:</span> {detail.reason ?? "—"}
            </p>
            <div>
              <p className="mb-1 font-semibold">Before</p>
              <pre className="max-h-32 overflow-auto rounded-md border border-border bg-muted/30 p-2">
                {detail.before_state ?? "—"}
              </pre>
            </div>
            <div>
              <p className="mb-1 font-semibold">After</p>
              <pre className="max-h-32 overflow-auto rounded-md border border-border bg-muted/30 p-2">
                {detail.after_state ?? "—"}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
