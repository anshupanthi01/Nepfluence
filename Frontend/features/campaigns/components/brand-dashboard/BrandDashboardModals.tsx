"use client"

import { FormEvent, ReactNode, useRef, useState } from "react"
import { BriefcaseBusiness, ClipboardList, Megaphone, Upload, UsersRound, X } from "lucide-react"
import type {
  MarketplaceApplication as Application,
  MarketplaceCampaign as Campaign,
  CampaignStatus,
  MarketplaceCollaboration as Collaboration,
} from "@/features/shared/marketplaceStore"
import { useClickOutside } from "@/hooks/useClickOutside"
import { useEscapeKey } from "@/hooks/useEscapeKey"
import { emptyCampaignForm, lifecycleSteps, money, statusClass } from "./brand-dashboard.shared"

type EditableCampaignStatus = Exclude<CampaignStatus, "OPEN">

export function CampaignFormModal({
  form,
  onChange,
  onClose,
  onFileChange,
  onSubmit,
}: {
  form: typeof emptyCampaignForm
  onChange: (form: typeof emptyCampaignForm) => void
  onClose: () => void
  onFileChange?: (file: File | null) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  useEscapeKey(true, onClose)

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#1f252b]/34 px-4 py-6" onClick={onClose}>
      <form className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-[#e8e2d9] bg-[#fbfaf7] shadow-[0_24px_70px_rgba(31,37,43,0.24)]" onSubmit={onSubmit} onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-[#e8e2d9] p-5">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8a8175]">Campaigns</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-[#1f252b]">Create campaign draft</h2>
            <p className="mt-1 max-w-xl text-sm font-semibold leading-6 text-[#69716b]">Save a draft first, then publish when the brief and budget feel ready.</p>
          </div>
          <button className="grid size-9 place-items-center rounded-full bg-[#f0ece5] text-[#1f252b] transition hover:bg-[#e4ddd2]" type="button" aria-label="Close campaign form" onClick={onClose}>
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-2">
          <Field label="Campaign title" required>
            <input required className="input" value={form.title} onChange={(event) => onChange({ ...form, title: event.target.value })} placeholder="e.g. Summer creator launch" />
          </Field>
          <Field label="Niche" required>
            <select required className="input" value={form.niche} onChange={(event) => onChange({ ...form, niche: event.target.value })}>
              <option value="" disabled>Select a niche</option>
              {["Beauty", "Food", "Travel", "Lifestyle", "Fashion", "Tech"].map((item) => <option key={item}>{item}</option>)}
            </select>
          </Field>
          <Field label="Budget (NPR)" required>
            <input required className="input" value={form.budget} onChange={(event) => onChange({ ...form, budget: event.target.value })} inputMode="numeric" placeholder="e.g. 50000" />
          </Field>
          <Field label="Country" required>
            <select required className="input" value={form.country} onChange={(event) => onChange({ ...form, country: event.target.value as "NP" | "IN" })}>
              <option value="" disabled>Select a country</option>
              <option value="NP">Nepal</option>
              <option value="IN">India</option>
            </select>
          </Field>
          <Field label="Platform" required>
            <select required className="input" value={form.platform} onChange={(event) => onChange({ ...form, platform: event.target.value })}>
              <option value="" disabled>Select a platform</option>
              {["Instagram Reels", "TikTok", "YouTube Shorts", "Instagram Stories"].map((item) => <option key={item}>{item}</option>)}
            </select>
          </Field>
          <Field label="Deadline">
            <input className="input" type="date" value={form.deadline} onChange={(event) => onChange({ ...form, deadline: event.target.value })} />
          </Field>
          <Field label="Brief" required wide>
            <textarea required className="input min-h-28 resize-none py-3" value={form.brief} onChange={(event) => onChange({ ...form, brief: event.target.value })} placeholder="Describe content format, must-have shots, revision rules, and approval criteria." />
          </Field>
          <div className="rounded-[20px] bg-white p-4 ring-1 ring-[#e8e2d9] md:col-span-2">
            <label className="flex cursor-pointer items-start gap-3" htmlFor="campaign-picture-input">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#f0ece5] text-[#1f252b]">
                <Upload className="size-4" aria-hidden="true" />
              </span>
              <span className="text-sm font-semibold leading-6 text-[#505852]">
                Upload a campaign cover image (optional).
              </span>
            </label>
            <input
              id="campaign-picture-input"
              className="mt-3 block w-full text-sm text-[#505852]"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null
                setSelectedFileName(file?.name ?? null)
                onFileChange?.(file)
              }}
            />
            {selectedFileName ? (
              <p className="mt-2.5 inline-flex w-fit items-center gap-1.5 rounded-full bg-[#fff5df] px-2.5 py-1 text-xs font-black text-[#9b6500]">
                {selectedFileName} — nothing uploads yet, this attaches once you click &ldquo;Save draft&rdquo; below.
              </p>
            ) : (
              <p className="mt-2.5 text-xs font-semibold text-[#8a8175]">
                No file chosen yet. Selecting one here does not upload it immediately — it&apos;s held until the draft is saved.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-[#e8e2d9] p-5 sm:flex-row sm:justify-end">
          <button className="h-10 rounded-full border border-[#ded8cf] px-4 text-sm font-black text-[#505852]" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="h-10 rounded-full bg-[#1f252b] px-4 text-sm font-black text-white transition hover:bg-[#303840]" type="submit">
            Save draft
          </button>
        </div>
      </form>
    </div>
  )
}

export function CampaignManageModal({
  applications,
  campaign,
  collaborations,
  onClose,
  onPublish,
  onUpdate,
  onViewApplications,
  onViewCollaborations,
}: {
  applications: Application[]
  campaign: Campaign
  collaborations: Collaboration[]
  onClose: () => void
  onPublish: (id: number) => void
  onUpdate: (id: number, updates: Partial<Pick<Campaign, "status" | "budget" | "deadline">>) => void
  onViewApplications: () => void
  onViewCollaborations: () => void
}) {
  const campaignApplications = applications.filter((application) => application.campaignId === campaign.id)
  const campaignCollaborations = collaborations.filter((collaboration) => collaboration.campaignId === campaign.id)
  const pendingApplications = campaignApplications.filter((application) => application.status === "PENDING").length
  const [form, setForm] = useState({
    status: (campaign.status === "OPEN" ? "PUBLISHED" : campaign.status) as EditableCampaignStatus,
    budget: campaign.budget.toString(),
    deadline: campaign.deadline === "Not set" ? "" : campaign.deadline,
  })

  function saveCampaignChanges() {
    onUpdate(campaign.id, {
      status: form.status as CampaignStatus,
      budget: Number(form.budget) || 0,
      deadline: form.deadline || "Not set",
    })
  }

  function publishCampaign() {
    onPublish(campaign.id)
    setForm((current) => ({ ...current, status: "PUBLISHED" }))
  }

  useEscapeKey(true, onClose)

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#1f252b]/34 px-4 py-6" onClick={onClose}>
      <section className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-[#e8e2d9] bg-[#fbfaf7] shadow-[0_24px_70px_rgba(31,37,43,0.24)]" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-[#e8e2d9] p-5">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8a8175]">Campaign manager</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-[#1f252b]">{campaign.title}</h2>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#69716b]">{campaign.brief}</p>
          </div>
          <button className="grid size-9 shrink-0 place-items-center rounded-full bg-[#f0ece5] text-[#1f252b] transition hover:bg-[#e4ddd2]" type="button" aria-label="Close campaign manager" onClick={onClose}>
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid gap-4 p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <CampaignStat icon={Megaphone} label="Status" value={campaign.status} />
            <CampaignStat icon={BriefcaseBusiness} label="Budget" value={money(campaign.budget)} />
            <CampaignStat icon={ClipboardList} label="Applications" value={campaignApplications.length.toString()} />
            <CampaignStat icon={UsersRound} label="Accepted" value={`${campaign.accepted}`} />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
            <div className="rounded-[22px] border border-[#e8e2d9] bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-black ${statusClass(campaign.status)}`}>{campaign.status}</span>
                <span className="rounded-full bg-[#f0ece5] px-2.5 py-1 text-xs font-black text-[#69716b]">{campaign.niche}</span>
                <span className="rounded-full bg-[#f0ece5] px-2.5 py-1 text-xs font-black text-[#69716b]">{campaign.platform}</span>
                <span className="rounded-full bg-[#f0ece5] px-2.5 py-1 text-xs font-black text-[#69716b]">{campaign.country}</span>
              </div>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <Info label="Deadline" value={campaign.deadline} />
                <Info label="Tracked reach" value={campaign.reach > 0 ? `${Math.round(campaign.reach / 1000)}K` : "0"} />
                <Info label="Pending applications" value={pendingApplications.toString()} />
                <Info label="Collaborations" value={campaignCollaborations.length.toString()} />
              </dl>
            </div>

            <div className="rounded-[22px] border border-[#e8e2d9] bg-white p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8a8175]">Next actions</p>
              <div className="mt-4 grid gap-2">
                {campaign.status === "DRAFT" && (
                  <button className="h-10 rounded-full bg-[#1f252b] px-4 text-sm font-black text-white transition hover:bg-[#303840]" type="button" onClick={publishCampaign}>
                    Publish campaign
                  </button>
                )}
                <button className="h-10 rounded-full border border-[#ded8cf] px-4 text-sm font-black text-[#505852] transition hover:border-[#1f252b]" type="button" onClick={onViewApplications}>
                  Review applications
                </button>
                <button className="h-10 rounded-full border border-[#ded8cf] px-4 text-sm font-black text-[#505852] transition hover:border-[#1f252b]" type="button" onClick={onViewCollaborations}>
                  View collaborations
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-[22px] border border-[#e8e2d9] bg-white p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8a8175]">Edit campaign</p>
            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
              <label className="text-xs font-black text-[#505852]">
                Status
                <select className="mt-2 h-11 w-full rounded-[18px] border border-[#ded8cf] bg-white px-4 text-sm font-semibold text-[#1f252b] outline-none focus:border-[#1f252b]" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as EditableCampaignStatus }))}>
                  {["DRAFT", "PUBLISHED", "CLOSED", "COMPLETED"].map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-black text-[#505852]">
                Budget
                <input className="mt-2 h-11 w-full rounded-[18px] border border-[#ded8cf] bg-white px-4 text-sm font-semibold text-[#1f252b] outline-none focus:border-[#1f252b]" inputMode="numeric" value={form.budget} onChange={(event) => setForm((current) => ({ ...current, budget: event.target.value }))} />
              </label>
              <label className="text-xs font-black text-[#505852]">
                Deadline
                <input className="mt-2 h-11 w-full rounded-[18px] border border-[#ded8cf] bg-white px-4 text-sm font-semibold text-[#1f252b] outline-none focus:border-[#1f252b]" type="date" value={form.deadline} onChange={(event) => setForm((current) => ({ ...current, deadline: event.target.value }))} />
              </label>
              <button className="h-11 rounded-full bg-[#1f252b] px-5 text-sm font-black text-white transition hover:bg-[#303840]" type="button" onClick={saveCampaignChanges}>
                Save changes
              </button>
            </div>
          </div>

          <div className="rounded-[22px] border border-[#e8e2d9] bg-white p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8a8175]">Recent applicants</p>
            <div className="mt-3 divide-y divide-[#e8e2d9]">
              {campaignApplications.slice(0, 4).map((application) => (
                <div key={application.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-black text-[#1f252b]">{application.creator}</p>
                    <p className="mt-1 text-xs font-semibold text-[#69716b]">{application.handle} / {application.niche} / {application.followers} followers</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {application.niche !== campaign.niche && (
                      <span className="rounded-full bg-[#fff5df] px-2.5 py-1 text-xs font-black text-[#9b6500]">Niche mismatch</span>
                    )}
                    <span className={`rounded-full px-2.5 py-1 text-xs font-black ${statusClass(application.status)}`}>{application.status}</span>
                  </div>
                </div>
              ))}
              {campaignApplications.length === 0 && (
                <p className="py-4 text-sm font-semibold text-[#69716b]">No creator applications have arrived for this campaign yet.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function CampaignStat({ icon: Icon, label, value }: { icon: typeof Megaphone; label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-[#e8e2d9] bg-white p-4">
      <span className="grid size-9 place-items-center rounded-full bg-[#f0ece5] text-[#1f252b]">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <p className="mt-4 text-xs font-black uppercase tracking-[0.12em] text-[#8a8175]">{label}</p>
      <p className="mt-1 truncate text-lg font-black text-[#1f252b]">{value}</p>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-black uppercase tracking-[0.12em] text-[#8a8175]">{label}</dt>
      <dd className="mt-1 font-black text-[#1f252b]">{value}</dd>
    </div>
  )
}

function Field({ label, children, required = false, wide = false }: { label: string; children: ReactNode; required?: boolean; wide?: boolean }) {
  return (
    <label className={`text-xs font-black text-[#505852] ${wide ? "md:col-span-2" : ""}`}>
      {label}
      {required && <span className="ml-0.5 text-[#9f1d1d]">*</span>}
      <div className="mt-2 [&_.input]:w-full [&_.input]:rounded-[18px] [&_.input]:border [&_.input]:border-[#ded8cf] [&_.input]:bg-white [&_.input]:px-4 [&_.input]:text-sm [&_.input]:font-semibold [&_.input]:text-[#1f252b] [&_.input]:outline-none [&_.input]:transition [&_.input]:focus:border-[#1f252b] [&_.input]:focus:ring-4 [&_.input]:focus:ring-[#1f252b]/8 [&_select.input]:h-11 [&_input.input]:h-11">
        {children}
      </div>
    </label>
  )
}

export function LifecycleModal({ onClose }: { onClose: () => void }) {
  useEscapeKey(true, onClose)

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#1f252b]/34 px-4" onClick={onClose}>
      <section className="w-full max-w-lg rounded-[28px] border border-[#e8e2d9] bg-[#fbfaf7] p-5 shadow-[0_24px_70px_rgba(31,37,43,0.24)]" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8a8175]">Workflow</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-[#1f252b]">Campaign to payout</h2>
          </div>
          <button className="grid size-9 place-items-center rounded-full bg-[#f0ece5] text-[#1f252b] transition hover:bg-[#e4ddd2]" type="button" aria-label="Close lifecycle" onClick={onClose}>
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-5 space-y-3">
          {lifecycleSteps.map((step, index) => (
            <div key={step} className="flex items-center gap-3 rounded-[18px] bg-white p-3 ring-1 ring-[#e8e2d9]">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#1f252b] text-xs font-black text-white">{index + 1}</span>
              <p className="text-sm font-semibold leading-6 text-[#505852]">{step}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export function SupportPanel({ onClose }: { onClose: () => void }) {
  const panelRef = useRef<HTMLElement>(null)
  useClickOutside(true, panelRef, onClose)
  useEscapeKey(true, onClose)

  return (
    <section ref={panelRef} className="fixed bottom-20 right-5 z-50 w-[min(380px,calc(100vw-2rem))] rounded-[24px] border border-[#e8e2d9] bg-[#fbfaf7] shadow-[0_18px_50px_rgba(31,37,43,0.16)]">
      <div className="flex items-start justify-between gap-3 border-b border-[#e8e2d9] p-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8a8175]">Support</p>
          <h2 className="mt-1 text-lg font-black text-[#1f252b]">Integration notes</h2>
        </div>
        <button className="grid size-8 place-items-center rounded-full bg-[#f0ece5] text-[#1f252b] transition hover:bg-[#e4ddd2]" type="button" aria-label="Close support" onClick={onClose}>
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="space-y-3 p-4 text-sm font-semibold leading-6 text-[#505852]">
        <p className="rounded-[18px] bg-white p-3 ring-1 ring-[#e8e2d9]">Campaigns, applications, collaboration rooms, payments, and trust reports are now styled as one brand workspace.</p>
        <p className="rounded-[18px] bg-[#f0ece5] p-3">Remaining backend gaps should be wired route by route as FastAPI endpoints are added.</p>
      </div>
    </section>
  )
}
