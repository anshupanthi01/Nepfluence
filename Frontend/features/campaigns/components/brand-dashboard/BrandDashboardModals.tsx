/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Bell,
  Boxes,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  CreditCard,
  FileText,
  Globe,
  IndianRupee,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Megaphone,
  MoreHorizontal,
  PlayCircle,
  Plus,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Upload,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react"
import { FormEvent, ReactNode, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  MarketplaceApplication as Application,
  MarketplaceCampaign as Campaign,
  MarketplaceCollaboration as Collaboration,
  ApplicationStatus,
  useMarketplaceStore,
} from "@/features/shared/marketplaceStore"
import { emptyCampaignForm, lifecycleSteps } from "./brand-dashboard.shared"

export function CampaignFormModal({
  form,
  onChange,
  onClose,
  onSubmit,
}: {
  form: typeof emptyCampaignForm
  onChange: (form: typeof emptyCampaignForm) => void
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/34 px-4 py-6">
      <form className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[8px] bg-white shadow-[0_24px_70px_rgba(20,21,34,0.28)]" onSubmit={onSubmit}>
        <div className="flex items-start justify-between gap-4 border-b border-[#edf0f6] p-5">
          <div>
            <p className="text-xs font-black uppercase text-[#6174f8]">Campaigns domain</p>
            <h2 className="mt-1 text-2xl font-black">Create campaign draft</h2>
            <p className="mt-1 text-sm font-medium text-[#727887]">This creates DRAFT state first. Publish after reviewing brief and budget.</p>
          </div>
          <button className="grid size-9 place-items-center rounded-full bg-[#f3f5fb]" type="button" aria-label="Close campaign form" onClick={onClose}>
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-2">
          <Field label="Campaign title">
            <input required className="input" value={form.title} onChange={(event) => onChange({ ...form, title: event.target.value })} placeholder="e.g. Himal Glow creator launch" />
          </Field>
          <Field label="Niche">
            <select className="input" value={form.niche} onChange={(event) => onChange({ ...form, niche: event.target.value })}>
              {["Beauty", "Food", "Travel", "Lifestyle", "Fashion", "Tech"].map((item) => <option key={item}>{item}</option>)}
            </select>
          </Field>
          <Field label="Budget">
            <input className="input" value={form.budget} onChange={(event) => onChange({ ...form, budget: event.target.value })} inputMode="numeric" />
          </Field>
          <Field label="Country">
            <select className="input" value={form.country} onChange={(event) => onChange({ ...form, country: event.target.value as "NP" | "IN" })}>
              <option value="NP">Nepal</option>
              <option value="IN">India</option>
            </select>
          </Field>
          <Field label="Platform">
            <select className="input" value={form.platform} onChange={(event) => onChange({ ...form, platform: event.target.value })}>
              {["Instagram Reels", "TikTok", "YouTube Shorts", "Instagram Stories"].map((item) => <option key={item}>{item}</option>)}
            </select>
          </Field>
          <Field label="Deadline">
            <input className="input" type="date" value={form.deadline} onChange={(event) => onChange({ ...form, deadline: event.target.value })} />
          </Field>
          <Field label="Brief" wide>
            <textarea required className="input min-h-28 resize-none py-3" value={form.brief} onChange={(event) => onChange({ ...form, brief: event.target.value })} placeholder="Describe content format, must-have shots, revision rules, and approval criteria." />
          </Field>
          <div className="rounded-[8px] bg-[#f7f8fb] p-4 md:col-span-2">
            <div className="flex items-start gap-3">
              <Upload className="mt-0.5 size-5 text-[#6174f8]" aria-hidden="true" />
              <p className="text-sm font-bold leading-6 text-[#606675]">
                File upload will later use S3 presigned URLs from the architecture. For now this form stores a local campaign draft.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-[#edf0f6] p-5">
          <button className="h-10 rounded-[8px] border border-[#e1e4ef] px-4 text-sm font-black" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="h-10 rounded-[8px] bg-[#6174f8] px-4 text-sm font-black text-white" type="submit">
            Save draft
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`text-sm font-black text-[#484b57] ${wide ? "md:col-span-2" : ""}`}>
      {label}
      <div className="mt-2 [&_.input]:h-11 [&_.input]:w-full [&_.input]:rounded-[8px] [&_.input]:border [&_.input]:border-[#dfe3ee] [&_.input]:bg-white [&_.input]:px-3 [&_.input]:text-sm [&_.input]:font-bold [&_.input]:outline-none [&_.input]:transition [&_.input]:focus:border-[#6174f8] [&_.input]:focus:ring-4 [&_.input]:focus:ring-[#6174f8]/10">
        {children}
      </div>
    </label>
  )
}

export function LifecycleModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/34 px-4">
      <section className="w-full max-w-lg rounded-[8px] bg-white p-5 shadow-[0_24px_70px_rgba(20,21,34,0.28)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase text-[#6174f8]">Architecture pattern</p>
            <h2 className="mt-1 text-2xl font-black">Campaign to payout lifecycle</h2>
          </div>
          <button className="grid size-9 place-items-center rounded-full bg-[#f3f5fb]" type="button" aria-label="Close lifecycle" onClick={onClose}>
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-5 space-y-3">
          {lifecycleSteps.map((step, index) => (
            <div key={step} className="flex items-center gap-3 rounded-[8px] border border-[#edf0f6] p-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#eef1ff] text-xs font-black text-[#6174f8]">{index + 1}</span>
              <p className="text-sm font-bold text-[#555866]">{step}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export function SupportPanel({ onClose }: { onClose: () => void }) {
  return (
    <section className="fixed bottom-20 right-5 z-50 w-[min(380px,calc(100vw-2rem))] rounded-[8px] border border-[#e4e7f1] bg-white shadow-[0_18px_50px_rgba(25,28,50,0.2)]">
      <div className="flex items-start justify-between gap-3 border-b border-[#edf0f6] p-4">
        <div>
          <p className="text-xs font-black uppercase text-[#6174f8]">Build note</p>
          <h2 className="text-lg font-black">Next integration step</h2>
        </div>
        <button className="grid size-8 place-items-center rounded-full bg-[#f3f5fb]" type="button" aria-label="Close support" onClick={onClose}>
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="space-y-3 p-4 text-sm font-bold leading-6 text-[#606675]">
        <p className="rounded-[8px] bg-[#f7f8fb] p-3">This UI now models real MVP flows locally. Backend wiring should map to campaigns, applications, collaboration, payments, and trust modules.</p>
        <p className="rounded-[8px] bg-[#eef1ff] p-3 text-[#5268df]">Use TanStack Query mutations once FastAPI routes are ready.</p>
      </div>
    </section>
  )
}
