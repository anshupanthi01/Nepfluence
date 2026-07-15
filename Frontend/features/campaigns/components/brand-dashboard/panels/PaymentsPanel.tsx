"use client"

import { CheckCircle2, IndianRupee, WalletCards } from "lucide-react"
import type { MarketplaceCollaboration as Collaboration, MarketplaceLedgerEntry, MarketplaceWallet } from "@/features/shared/marketplaceStore"
import { money } from "../brand-dashboard.shared"
import { CollaborationsPanel } from "./CollaborationsPanel"
import { MetricCard } from "./MetricCard"

export function PaymentsPanel({
  collaborations,
  paymentTotal,
  wallet,
  ledger,
  onDeposit,
  onApprove,
  onMessage,
  depositErrors,
}: {
  collaborations: Collaboration[]
  paymentTotal: number
  wallet: MarketplaceWallet | null
  ledger: MarketplaceLedgerEntry[]
  onDeposit: (id: number) => void
  onApprove: (id: number) => void
  onMessage: (id: number) => void
  depositErrors?: Record<number, string>
}) {
  const releasedTotal = collaborations.filter((item) => item.escrow === "RELEASED").reduce((sum, item) => sum + item.payout, 0)

  return (
    <section className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard icon={WalletCards} label="Brand wallet" value={money(wallet?.balance ?? 0)} detail="Available simulated balance" />
        <MetricCard icon={IndianRupee} label="Escrow held" value={money(paymentTotal)} detail="Moved out of wallet until approval" />
        <MetricCard icon={CheckCircle2} label="Released payouts" value={money(releasedTotal)} detail="Paid to creator wallets" />
      </div>
      <section className="rounded-[24px] border border-[#e8e2d9] bg-[#fbfaf7] p-5 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8a8175]">Wallet ledger</p>
            <h2 className="mt-1 text-lg font-black text-[#1f252b]">Simulated money movement</h2>
          </div>
          <p className="text-xs font-semibold text-[#69716b]">Deposits reduce brand balance, escrow holds funds, approval releases creator payout.</p>
        </div>
        <div className="mt-4 divide-y divide-[#e8e2d9] overflow-hidden rounded-[18px] border border-[#e8e2d9] bg-white">
          {ledger.map((entry) => (
            <div key={entry.id} className="grid gap-2 p-4 text-sm sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="font-black text-[#1f252b]">{entry.type === "ESCROW_DEPOSIT" ? "Escrow deposit" : "Payout release"}</p>
                <p className="mt-1 text-xs font-semibold text-[#69716b]">{new Date(entry.createdAt).toLocaleString()}</p>
              </div>
              <p className="font-black text-[#1f252b]">{money(entry.amount)}</p>
            </div>
          ))}
          {ledger.length === 0 && (
            <div className="p-5 text-center">
              <p className="text-sm font-black text-[#1f252b]">No wallet movement yet</p>
              <p className="mt-1 text-xs font-semibold text-[#69716b]">Deposit escrow from a collaboration to create the first ledger entry.</p>
            </div>
          )}
        </div>
      </section>
      <CollaborationsPanel collaborations={collaborations} onDeposit={onDeposit} onApprove={onApprove} onMessage={onMessage} depositErrors={depositErrors} />
    </section>
  )
}
