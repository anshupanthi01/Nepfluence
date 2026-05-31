"use client"

import { BadgeCheck, Camera, CheckCircle2, Edit3, Eye, Globe, Heart, PlayCircle, Star, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { creatorAnalytics, creatorProfileImage, portfolioShots } from "../creator-dashboard.shared"

const profileTags = ["Beauty UGC", "Skincare", "Short-form video", "Kathmandu", "Product demos"]

export function ProfilePanel() {
  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="overflow-hidden rounded-[28px] border border-[#e8e2d9] bg-[#fbfaf7] shadow-[0_18px_46px_rgba(31,37,43,0.07)]">
        <div className="relative min-h-[300px] bg-[#e8e2d9]">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1600&q=80)" }} />
          <div className="absolute inset-0 bg-gradient-to-r from-[#fbfaf7] via-[#fbfaf7]/82 to-[#fbfaf7]/25" />

          <div className="relative flex min-h-[300px] flex-col justify-end gap-5 p-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="relative">
                <div className="size-32 rounded-[28px] bg-[#eee8df] bg-cover bg-center shadow-[0_18px_44px_rgba(31,37,43,0.18)] ring-4 ring-white" style={{ backgroundImage: `url(${creatorProfileImage})` }} />
                <button className="absolute -bottom-2 -right-2 grid size-10 place-items-center rounded-full bg-[#1f252b] text-white shadow-lg" type="button" aria-label="Change profile photo">
                  <Camera className="size-4" aria-hidden="true" />
                </button>
              </div>

              <div className="max-w-xl">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1 text-xs font-black text-[#1f252b] ring-1 ring-[#e8e2d9]">
                  <BadgeCheck className="size-3.5 text-[#16864f]" aria-hidden="true" />
                  Verified creator
                </span>
                <h2 className="mt-3 text-4xl font-black tracking-tight text-[#1f252b]">Aarati Rai</h2>
                <p className="mt-1 text-sm font-black text-[#69716b]">@aaratiugc / Beauty UGC / Kathmandu, Nepal</p>
                <p className="mt-3 max-w-lg text-sm font-semibold leading-6 text-[#505852]">
                  Clean beauty reels, skincare explainers, and local lifestyle UGC for brands entering the Nepal market.
                </p>
              </div>
            </div>

            <Button className="h-10 rounded-full bg-[#1f252b] px-4 text-xs font-black text-white hover:bg-[#363d43]" type="button">
              <Edit3 className="size-4" aria-hidden="true" />
              Edit profile
            </Button>
          </div>
        </div>

        <div className="space-y-5 p-5">
          <div className="flex flex-wrap gap-2">
            {profileTags.map((tag) => (
              <span key={tag} className="rounded-full bg-[#f0ece5] px-3 py-1.5 text-xs font-black text-[#505852]">{tag}</span>
            ))}
          </div>

          <section className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
            <div className="rounded-[24px] border border-[#e8e2d9] bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8a8175]">Profile details</p>
                  <h3 className="mt-1 text-lg font-black tracking-tight text-[#1f252b]">Public creator card</h3>
                </div>
                <Globe className="size-4 text-[#8a8175]" aria-hidden="true" />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field label="Display name" value="Aarati Rai" />
                <Field label="Handle" value="@aaratiugc" />
                <Field label="Category" value="Beauty UGC" />
                <Field label="Location" value="Kathmandu, Nepal" />
              </div>
              <label className="mt-3 block text-xs font-black text-[#69716b]">
                Bio
                <textarea className="mt-2 min-h-24 w-full resize-none rounded-[18px] border border-[#ded8cf] bg-[#fbfaf7] px-4 py-3 text-sm font-semibold leading-6 text-[#505852] outline-none focus:border-[#1f252b]" defaultValue="I create clean, conversion-focused beauty reels, skincare explainers, and local lifestyle UGC for brands entering Nepal." />
              </label>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button className="h-9 rounded-full bg-[#1f252b] px-4 text-xs font-black text-white hover:bg-[#363d43]" type="button">Save changes</Button>
                <Button className="h-9 rounded-full border-[#ded8cf] px-4 text-xs font-black text-[#505852]" variant="outline" type="button">Preview public profile</Button>
              </div>
            </div>

            <div className="rounded-[24px] border border-[#e8e2d9] bg-white p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8a8175]">Media kit</p>
              <h3 className="mt-1 text-lg font-black tracking-tight text-[#1f252b]">Creator strength</h3>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <SmallStat label="Followers" value="42K" />
                <SmallStat label="Avg views" value="31K" />
                <SmallStat label="Rating" value="4.9" />
              </div>
              <div className="mt-4 space-y-2 text-sm font-semibold text-[#505852]">
                <Signal icon={Eye} text="284K estimated monthly reach" />
                <Signal icon={Heart} text="Beauty audience strength" />
                <Signal icon={Star} text="Brand response under 12h" />
              </div>
            </div>
          </section>

          <section className="rounded-[24px] border border-[#e8e2d9] bg-white p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8a8175]">Analytics</p>
                <h3 className="mt-1 text-lg font-black tracking-tight text-[#1f252b]">Visible to brands</h3>
              </div>
              <span className="w-fit rounded-full bg-[#e9f8ef] px-3 py-1 text-xs font-black text-[#16864f]">Profile is marketplace ready</span>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
              {creatorAnalytics.map((item) => (
                <div key={item.label} className="rounded-[18px] bg-[#f5f3ef] p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8a8175]">{item.label}</p>
                  <p className="mt-2 text-xl font-black text-[#1f252b]">{item.value}</p>
                  <p className="mt-1 text-[11px] font-semibold leading-4 text-[#69716b]">{item.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[24px] border border-[#e8e2d9] bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8a8175]">Portfolio</p>
                <h3 className="mt-1 text-lg font-black tracking-tight text-[#1f252b]">Featured work</h3>
              </div>
              <Button className="h-9 rounded-full border-[#ded8cf] px-3 text-xs font-black text-[#505852]" variant="outline" type="button">
                <Upload className="size-4" aria-hidden="true" />
                Add work
              </Button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {portfolioShots.map((shot) => (
                <article key={shot.title} className="overflow-hidden rounded-[20px] border border-[#e8e2d9] bg-[#fbfaf7]">
                  <div className="relative h-36 bg-cover bg-center" style={{ backgroundImage: `url(${shot.image})` }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1f252b]/60 via-transparent to-transparent" />
                    <span className="absolute left-3 top-3 rounded-full bg-white/92 px-2 py-1 text-[11px] font-black text-[#1f252b]">{shot.type}</span>
                    <span className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-white/92 text-[#1f252b]">
                      <PlayCircle className="size-4" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="p-3">
                    <h4 className="line-clamp-1 text-sm font-black text-[#1f252b]">{shot.title}</h4>
                    <p className="mt-1 text-xs font-semibold text-[#69716b]">{shot.platform} / {shot.metric}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-[28px] border border-[#e8e2d9] bg-[#fbfaf7] p-5 shadow-[0_18px_46px_rgba(31,37,43,0.07)]">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8a8175]">Creator score</p>
          <div className="mt-4 rounded-[24px] bg-[#1f252b] p-6 text-center text-white">
            <div className="text-5xl font-black">92</div>
            <p className="mt-2 text-sm font-semibold text-white/72">Strong marketplace readiness</p>
          </div>
          <div className="mt-4 space-y-2">
            {["Complete payout verification", "Add three recent content samples", "Keep response time under 24 hours"].map((item) => (
              <p key={item} className="flex items-center gap-2 rounded-[16px] bg-white px-3 py-3 text-sm font-semibold text-[#505852]">
                <CheckCircle2 className="size-4 text-[#16864f]" aria-hidden="true" />
                {item}
              </p>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-[#e8e2d9] bg-[#fbfaf7] p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8a8175]">Profile checklist</p>
          <div className="mt-4 space-y-3">
            <ChecklistItem title="Verified creator" body="Handle ownership and profile review are ready for backend verification." />
            <ChecklistItem title="Portfolio assets" body="Add recent reels and campaign proof once upload storage is connected." />
            <ChecklistItem title="Match profile" body="Beauty UGC, Kathmandu reach, and short-form video inform campaign matching." />
          </div>
        </div>
      </aside>
    </section>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="text-xs font-black text-[#69716b]">
      {label}
      <input className="mt-2 h-10 w-full rounded-full border border-[#ded8cf] bg-[#fbfaf7] px-4 text-sm font-semibold text-[#505852] outline-none focus:border-[#1f252b]" defaultValue={value} />
    </label>
  )
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] bg-[#f5f3ef] p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8a8175]">{label}</p>
      <p className="mt-1 text-sm font-black text-[#1f252b]">{value}</p>
    </div>
  )
}

function Signal({ icon: Icon, text }: { icon: typeof Eye; text: string }) {
  return (
    <p className="flex items-center gap-2 rounded-[16px] bg-[#f5f3ef] p-3">
      <Icon className="size-4 text-[#8a8175]" aria-hidden="true" />
      {text}
    </p>
  )
}

function ChecklistItem({ body, title }: { body: string; title: string }) {
  return (
    <div className="rounded-[18px] bg-white p-4">
      <h3 className="text-sm font-black text-[#1f252b]">{title}</h3>
      <p className="mt-1 text-xs font-semibold leading-5 text-[#69716b]">{body}</p>
    </div>
  )
}
