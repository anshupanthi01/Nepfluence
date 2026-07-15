"use client"

import { useEffect, useState } from "react"

import { DataTable, type DataTableColumn } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Modal, ModalConfirm } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  adjustCollaboration,
  flagDispute,
  getCollaboration,
  listCollaborations,
  listPayoutQueue,
  pauseCollaboration,
  refundCollaboration,
  resumeCollaboration,
} from "@/features/admin/api/escrow"
import {
  COLLABORATION_STATE_TONE,
  ESCROW_STATUS_TONE,
  LEDGER_TYPE_TONE,
  formatCurrency,
  formatFeeLine,
} from "@/features/admin/components/escrow-console/escrow-console.shared"
import type {
  AdminCollaborationDetail,
  AdminCollaborationListItem,
  AdminCollaborationState,
  AdminEscrowStatus,
  PayoutQueueItem,
} from "@/features/admin/types/admin.types"

const PAGE_SIZE = 20

const COLLABORATION_STATE_OPTIONS: AdminCollaborationState[] = [
  "escrow_pending",
  "in_progress",
  "submitted",
  "approved",
  "paused",
  "disputed",
  "cancelled",
]

const ESCROW_STATUS_OPTIONS: AdminEscrowStatus[] = ["pending", "held", "released"]

type ActionMode = null | "pause" | "resume" | "dispute" | "refund" | "adjust"

export function EscrowConsolePanel() {
  const [tab, setTab] = useState<"collaborations" | "payouts">("collaborations")

  const [collabPage, setCollabPage] = useState(1)
  const [collabState, setCollabState] = useState<AdminCollaborationState | "all">("all")
  const [collabEscrowStatus, setCollabEscrowStatus] = useState<AdminEscrowStatus | "all">("all")
  const [collabQuery, setCollabQuery] = useState("")
  const [collabRows, setCollabRows] = useState<AdminCollaborationListItem[]>([])
  const [collabTotal, setCollabTotal] = useState(0)
  const [collabLoading, setCollabLoading] = useState(true)

  const [payoutPage, setPayoutPage] = useState(1)
  const [payoutRows, setPayoutRows] = useState<PayoutQueueItem[]>([])
  const [payoutTotal, setPayoutTotal] = useState(0)
  const [payoutLoading, setPayoutLoading] = useState(true)

  const [detail, setDetail] = useState<AdminCollaborationDetail | null>(null)
  const [actionMode, setActionMode] = useState<ActionMode>(null)
  const [amount, setAmount] = useState("")
  const [adjustType, setAdjustType] = useState<"credit" | "debit">("credit")
  const [isSubmitting, setIsSubmitting] = useState(false)

  function refreshCollaborations() {
    setCollabLoading(true)
    listCollaborations({
      state: collabState === "all" ? undefined : collabState,
      escrow_status: collabEscrowStatus === "all" ? undefined : collabEscrowStatus,
      q: collabQuery || undefined,
      page: collabPage,
      page_size: PAGE_SIZE,
    })
      .then((result) => {
        setCollabRows(result.items)
        setCollabTotal(result.total)
      })
      .finally(() => setCollabLoading(false))
  }

  function refreshPayoutQueue() {
    setPayoutLoading(true)
    listPayoutQueue({ page: payoutPage, page_size: PAGE_SIZE })
      .then((result) => {
        setPayoutRows(result.items)
        setPayoutTotal(result.total)
      })
      .finally(() => setPayoutLoading(false))
  }

  useEffect(() => {
    refreshCollaborations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collabPage, collabState, collabEscrowStatus, collabQuery])

  useEffect(() => {
    refreshPayoutQueue()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payoutPage])

  async function openDetail(collaborationId: number) {
    const data = await getCollaboration(collaborationId)
    setDetail(data)
  }

  function closeDetail() {
    setDetail(null)
    setActionMode(null)
    setAmount("")
  }

  async function handleSimpleAction(reason: string) {
    if (!detail || !actionMode) return
    setIsSubmitting(true)
    try {
      if (actionMode === "pause") await pauseCollaboration(detail.id, reason)
      if (actionMode === "resume") await resumeCollaboration(detail.id, reason)
      if (actionMode === "dispute") await flagDispute(detail.id, reason)
      const refreshed = await getCollaboration(detail.id)
      setDetail(refreshed)
      setActionMode(null)
      refreshCollaborations()
      refreshPayoutQueue()
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRefund(reason: string) {
    if (!detail) return
    const amountValue = Number(amount)
    if (!amountValue || amountValue <= 0) return
    setIsSubmitting(true)
    try {
      await refundCollaboration(detail.id, amountValue, reason)
      const refreshed = await getCollaboration(detail.id)
      setDetail(refreshed)
      setActionMode(null)
      setAmount("")
      refreshCollaborations()
      refreshPayoutQueue()
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleAdjust(reason: string) {
    if (!detail) return
    const amountValue = Number(amount)
    if (!amountValue || amountValue <= 0) return
    setIsSubmitting(true)
    try {
      await adjustCollaboration(detail.id, adjustType, amountValue, reason)
      const refreshed = await getCollaboration(detail.id)
      setDetail(refreshed)
      setActionMode(null)
      setAmount("")
      refreshCollaborations()
    } finally {
      setIsSubmitting(false)
    }
  }

  const collabColumns: DataTableColumn<AdminCollaborationListItem>[] = [
    { key: "campaign_title", header: "Campaign" },
    { key: "brand_name", header: "Brand" },
    { key: "creator_name", header: "Creator" },
    { key: "state", header: "State", render: (row) => <StatusBadge label={row.state} tone={COLLABORATION_STATE_TONE[row.state]} /> },
    {
      key: "escrow_status",
      header: "Escrow",
      render: (row) => <StatusBadge label={row.escrow_status} tone={ESCROW_STATUS_TONE[row.escrow_status]} />,
    },
    { key: "payout_amount", header: "Payout", render: (row) => formatCurrency(row.payout_amount) },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <Button variant="outline" size="sm" onClick={() => openDetail(row.id)}>
          View
        </Button>
      ),
    },
  ]

  const payoutColumns: DataTableColumn<PayoutQueueItem>[] = [
    { key: "campaign_title", header: "Campaign" },
    { key: "brand_name", header: "Brand" },
    { key: "creator_name", header: "Creator" },
    { key: "gross_amount", header: "Gross", render: (row) => formatCurrency(row.gross_amount) },
    {
      key: "platform_fee_amount",
      header: "Platform fee",
      render: (row) => formatFeeLine(row.platform_fee_amount, row.platform_fee_percent),
    },
    {
      key: "tds_amount",
      header: "TDS",
      render: (row) => formatFeeLine(row.tds_amount, row.tds_rate_percent),
    },
    { key: "net_payout", header: "Net payout", render: (row) => formatCurrency(row.net_payout) },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <Button variant="outline" size="sm" onClick={() => openDetail(row.collaboration_id)}>
          View
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Escrow & Payments Console</h1>
        <p className="text-sm text-muted-foreground">
          Read-only ledger, live balances derived from entries. No balance is ever edited directly — every action
          appends a new ledger entry.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as "collaborations" | "payouts")}>
        <TabsList>
          <TabsTrigger value="collaborations">All Collaborations</TabsTrigger>
          <TabsTrigger value="payouts">Payout Queue</TabsTrigger>
        </TabsList>

        <TabsContent value="collaborations">
          <div className="mb-3 flex items-center gap-2">
            <Input
              placeholder="Search campaign title…"
              value={collabQuery}
              onChange={(event) => {
                setCollabPage(1)
                setCollabQuery(event.target.value)
              }}
              className="max-w-xs"
            />
            <Select
              value={collabState}
              onValueChange={(value) => {
                setCollabPage(1)
                setCollabState(value as AdminCollaborationState | "all")
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All states</SelectItem>
                {COLLABORATION_STATE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option.replaceAll("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={collabEscrowStatus}
              onValueChange={(value) => {
                setCollabPage(1)
                setCollabEscrowStatus(value as AdminEscrowStatus | "all")
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Escrow status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All escrow statuses</SelectItem>
                {ESCROW_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option.replaceAll("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DataTable
            columns={collabColumns}
            rows={collabRows}
            rowKey={(row) => row.id}
            page={collabPage}
            pageSize={PAGE_SIZE}
            total={collabTotal}
            onPageChange={setCollabPage}
            isLoading={collabLoading}
            emptyMessage="No collaborations found."
          />
        </TabsContent>

        <TabsContent value="payouts">
          <DataTable
            columns={payoutColumns}
            rows={payoutRows}
            rowKey={(row) => row.collaboration_id}
            page={payoutPage}
            pageSize={PAGE_SIZE}
            total={payoutTotal}
            onPageChange={setPayoutPage}
            isLoading={payoutLoading}
            emptyMessage="No pending payouts."
          />
        </TabsContent>
      </Tabs>

      <Modal
        open={Boolean(detail) && actionMode === null}
        onOpenChange={(open) => !open && closeDetail()}
        title={detail ? `${detail.campaign_title}` : ""}
        description={detail ? `${detail.brand_name} → ${detail.creator_name}` : undefined}
        className="max-w-lg"
      >
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <StatusBadge label={detail.state} tone={COLLABORATION_STATE_TONE[detail.state]} />
              <StatusBadge label={detail.escrow_status} tone={ESCROW_STATUS_TONE[detail.escrow_status]} />
            </div>

            <div>
              <p className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Agreed payout (contract amount, not yet moved until it appears below)
              </p>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <dt className="text-muted-foreground">Gross</dt>
                <dd className="text-right font-medium">{formatCurrency(detail.payout_amount)}</dd>
                <dt className="text-muted-foreground">Platform fee</dt>
                <dd className="text-right">{formatFeeLine(detail.platform_fee_amount, detail.platform_fee_percent)}</dd>
                <dt className="text-muted-foreground">TDS</dt>
                <dd className="text-right">{formatFeeLine(detail.tds_amount, detail.tds_rate_percent)}</dd>
                <dt className="text-muted-foreground">Net payout</dt>
                <dd className="text-right font-medium">{formatCurrency(detail.net_payout)}</dd>
              </dl>
            </div>

            <div>
              <p className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Ledger (append-only — the only record of money actually moved)
              </p>
              <div className="max-h-48 overflow-y-auto rounded-md border border-border">
                <table className="w-full text-xs">
                  <tbody>
                    {detail.ledger_entries.length === 0 && (
                      <tr>
                        <td className="px-2 py-2 text-muted-foreground">
                          Nothing has moved through escrow yet for this collaboration.
                        </td>
                      </tr>
                    )}
                    {detail.ledger_entries.map((entry) => (
                      <tr key={entry.id} className="border-b border-border last:border-0">
                        <td className="px-2 py-1.5">
                          <StatusBadge label={entry.type} tone={LEDGER_TYPE_TONE[entry.type]} />
                        </td>
                        <td className="px-2 py-1.5 text-right font-medium">{formatCurrency(entry.amount)}</td>
                        <td className="px-2 py-1.5 text-muted-foreground">
                          {new Date(entry.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setActionMode("pause")}>
                Pause
              </Button>
              <Button variant="outline" size="sm" onClick={() => setActionMode("resume")}>
                Resume
              </Button>
              <Button variant="outline" size="sm" onClick={() => setActionMode("dispute")}>
                Flag dispute
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setActionMode("refund")}>
                Refund
              </Button>
              <Button variant="outline" size="sm" onClick={() => setActionMode("adjust")}>
                Adjust
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ModalConfirm
        open={actionMode === "pause"}
        onOpenChange={(open) => !open && setActionMode(null)}
        title="Pause collaboration"
        description="Sets state to paused. This takes effect immediately and is recorded to the audit log."
        confirmLabel="Pause"
        destructive={false}
        isSubmitting={isSubmitting}
        onConfirm={handleSimpleAction}
      />
      <ModalConfirm
        open={actionMode === "resume"}
        onOpenChange={(open) => !open && setActionMode(null)}
        title="Resume collaboration"
        description="Sets state back to in progress. This takes effect immediately and is recorded to the audit log."
        confirmLabel="Resume"
        destructive={false}
        isSubmitting={isSubmitting}
        onConfirm={handleSimpleAction}
      />
      <ModalConfirm
        open={actionMode === "dispute"}
        onOpenChange={(open) => !open && setActionMode(null)}
        title="Flag for dispute"
        description="Marks this collaboration as disputed for the Dispute Resolution queue. This takes effect immediately and is recorded to the audit log."
        confirmLabel="Flag dispute"
        isSubmitting={isSubmitting}
        onConfirm={handleSimpleAction}
      />

      <Modal
        open={actionMode === "refund"}
        onOpenChange={(open) => !open && setActionMode(null)}
        title="Refund"
        description="Writes a new refund ledger entry — this takes effect immediately and cannot be undone, only offset by a further ledger entry. A full-amount refund also cancels the collaboration."
        footer={
          <RefundFooter
            isSubmitting={isSubmitting}
            onCancel={() => setActionMode(null)}
            onConfirm={handleRefund}
            amount={amount}
          />
        }
      >
        <div className="space-y-3">
          <Input
            type="number"
            min={1}
            max={detail?.payout_amount}
            placeholder={`Amount (up to ${detail ? formatCurrency(detail.payout_amount) : ""})`}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>
      </Modal>

      <Modal
        open={actionMode === "adjust"}
        onOpenChange={(open) => !open && setActionMode(null)}
        title="Manual adjustment"
        description="Writes a new adjustment ledger entry against this collaboration's creator payout — this takes effect immediately and cannot be undone, only offset by a further adjustment. Capped at the collaboration's agreed payout amount."
        footer={
          <AdjustFooter
            isSubmitting={isSubmitting}
            onCancel={() => setActionMode(null)}
            onConfirm={handleAdjust}
            amount={amount}
          />
        }
      >
        <div className="space-y-3">
          <Select value={adjustType} onValueChange={(value) => setAdjustType(value as "credit" | "debit")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="credit">Credit (increase payout)</SelectItem>
              <SelectItem value="debit">Debit (decrease payout)</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="number"
            min={1}
            max={detail?.payout_amount}
            placeholder={`Amount (up to ${detail ? formatCurrency(detail.payout_amount) : ""})`}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>
      </Modal>
    </div>
  )
}

function RefundFooter({
  isSubmitting,
  amount,
  onCancel,
  onConfirm,
}: {
  isSubmitting: boolean
  amount: string
  onCancel: () => void
  onConfirm: (reason: string) => void
}) {
  const [reason, setReason] = useState("")
  const canSubmit = Number(amount) > 0 && reason.trim().length > 0

  return (
    <div className="w-full space-y-3">
      <Textarea
        placeholder="Reason (required, recorded to the audit log)"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        rows={2}
      />
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button variant="destructive" disabled={!canSubmit || isSubmitting} onClick={() => onConfirm(reason)}>
          Refund
        </Button>
      </div>
    </div>
  )
}

function AdjustFooter({
  isSubmitting,
  amount,
  onCancel,
  onConfirm,
}: {
  isSubmitting: boolean
  amount: string
  onCancel: () => void
  onConfirm: (reason: string) => void
}) {
  const [reason, setReason] = useState("")
  const canSubmit = Number(amount) > 0 && reason.trim().length > 0

  return (
    <div className="w-full space-y-3">
      <Textarea
        placeholder="Reason (required, recorded to the audit log)"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        rows={2}
      />
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button disabled={!canSubmit || isSubmitting} onClick={() => onConfirm(reason)}>
          Apply
        </Button>
      </div>
    </div>
  )
}
