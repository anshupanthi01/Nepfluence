"use client"

import { useEffect, useState } from "react"

import { DataTable, type DataTableColumn } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Modal } from "@/components/ui/modal"
import { Textarea } from "@/components/ui/textarea"
import { listCampaigns, setCampaignStatus } from "@/features/admin/api/campaigns"
import { CAMPAIGN_STATUS_OPTIONS, CAMPAIGN_STATUS_TONE } from "@/features/admin/components/campaign-oversight/campaign-oversight.shared"
import type { AdminCampaignListItem, AdminCampaignStatus } from "@/features/admin/types/admin.types"

const PAGE_SIZE = 20

export function CampaignOversightPanel() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<AdminCampaignStatus | "all">("all")
  const [q, setQ] = useState("")
  const [rows, setRows] = useState<AdminCampaignListItem[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [target, setTarget] = useState<AdminCampaignListItem | null>(null)
  const [nextStatus, setNextStatus] = useState<AdminCampaignStatus>("in_review")
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    listCampaigns({ status: status === "all" ? undefined : status, q: q || undefined, page, page_size: PAGE_SIZE })
      .then((result) => {
        if (cancelled) return
        setRows(result.items)
        setTotal(result.total)
        setError(null)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "Failed to load campaigns")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [status, q, page])

  function openStatusModal(row: AdminCampaignListItem) {
    setTarget(row)
    setNextStatus(row.status)
    setReason("")
  }

  async function handleConfirm() {
    if (!target || !reason.trim()) return
    setIsSubmitting(true)
    try {
      await setCampaignStatus(target.id, nextStatus, reason)
      setRows((prev) => prev.map((row) => (row.id === target.id ? { ...row, status: nextStatus } : row)))
      setTarget(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns: DataTableColumn<AdminCampaignListItem>[] = [
    { key: "title", header: "Campaign" },
    { key: "brand_name", header: "Brand" },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge label={row.status} tone={CAMPAIGN_STATUS_TONE[row.status]} />,
    },
    {
      key: "budget",
      header: "Budget",
      render: (row) =>
        row.budget_min === row.budget_max
          ? row.budget_min.toLocaleString()
          : `${row.budget_min.toLocaleString()} - ${row.budget_max.toLocaleString()}`,
    },
    { key: "niche", header: "Niche", render: (row) => row.niche ?? "—" },
    {
      key: "deadline",
      header: "Deadline",
      render: (row) => (row.deadline ? new Date(row.deadline).toLocaleDateString() : "—"),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <Button variant="outline" size="sm" onClick={() => openStatusModal(row)}>
          Change status
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Campaign Oversight</h1>
        <p className="text-sm text-muted-foreground">Review and intervene on campaigns across every brand.</p>
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Search title…"
          value={q}
          onChange={(event) => {
            setPage(1)
            setQ(event.target.value)
          }}
          className="max-w-xs"
        />
        <Select
          value={status}
          onValueChange={(value) => {
            setPage(1)
            setStatus(value as AdminCampaignStatus | "all")
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {CAMPAIGN_STATUS_OPTIONS.map((option) => (
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
        emptyMessage="No campaigns found."
      />

      <Modal
        open={Boolean(target)}
        onOpenChange={(open) => !open && setTarget(null)}
        title={`Change status — ${target?.title ?? ""}`}
        description="Recorded to the audit log with your reason."
        footer={
          <>
            <Button variant="outline" onClick={() => setTarget(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={isSubmitting || !reason.trim()}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Select value={nextStatus} onValueChange={(value) => setNextStatus(value as AdminCampaignStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CAMPAIGN_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option.replaceAll("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            placeholder="Reason (required, recorded to the audit log)"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
          />
        </div>
      </Modal>
    </div>
  )
}
