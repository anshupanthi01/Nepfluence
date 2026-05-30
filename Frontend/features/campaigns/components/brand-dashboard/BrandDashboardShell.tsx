"use client"

import Link from "next/link"
import { ArrowRight, Bell, Menu, MessageSquare, Plus, ShieldCheck } from "lucide-react"
import type { ReactNode } from "react"
import { type Section, navItems } from "./brand-dashboard.shared"

type BrandDashboardShellProps = {
  activeSection: Section
  mobileMenuOpen: boolean
  onCloseMobileMenu: () => void
  onNavigate: (section: Section) => void
  onOpenCampaign: () => void
  onOpenLifecycle: () => void
  onOpenMobileMenu: () => void
  onOpenNotifications: () => void
  onOpenSupport: () => void
  children: ReactNode
}

export function BrandDashboardShell({
  activeSection,
  mobileMenuOpen,
  onCloseMobileMenu,
  onNavigate,
  onOpenCampaign,
  onOpenLifecycle,
  onOpenMobileMenu,
  onOpenNotifications,
  onOpenSupport,
  children,
}: BrandDashboardShellProps) {
  const sidebar = (
    <aside className="flex h-full flex-col bg-white">
      <Link href="/" className="flex h-16 items-center gap-3 border-b border-[#eceef5] px-5" aria-label="Nepfluence home">
        <span className="grid size-9 rotate-[-35deg] grid-cols-3 gap-1">
          {Array.from({ length: 9 }).map((_, index) => (
            <span key={index} className="rounded-full bg-[#7894ff]" style={{ opacity: index % 2 === 0 ? 1 : 0.58 }} />
          ))}
        </span>
        <span className="text-xl font-black text-[#17171f]">Nepfluence</span>
      </Link>

      <nav className="flex-1 space-y-1 px-3 py-5">
        {navItems.map((item) => {
          const Icon = item.icon

          return (
            <button
              key={item.label}
              className={`flex w-full items-center gap-3 rounded-[8px] px-3 py-2.5 text-left text-sm font-bold transition ${
                activeSection === item.label ? "bg-[#eef1ff] text-[#6174f8]" : "text-[#555866] hover:bg-[#f7f8fc] hover:text-[#17171f]"
              }`}
              type="button"
              onClick={() => onNavigate(item.label)}
            >
              <Icon className="size-4" aria-hidden="true" />
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="border-t border-[#eceef5] p-4">
        <div className="rounded-[8px] bg-[#151525] p-4 text-white">
          <p className="text-xs font-black uppercase text-[#aeb8ff]">MVP workflow</p>
          <p className="mt-2 text-sm font-bold leading-5 text-white/86">Campaigns, escrow, chat, deliverables, and reviews stay connected.</p>
          <button className="mt-4 inline-flex h-8 items-center gap-2 rounded-full bg-white px-3 text-xs font-black text-[#151525]" type="button" onClick={onOpenLifecycle}>
            View lifecycle <ArrowRight className="size-3" aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  )

  return (
    <main className="min-h-screen bg-[#f7f8fb] font-[Arial,Helvetica,sans-serif] text-[#17171f]">
      <div className="flex min-h-screen">
        <div className="hidden w-[260px] shrink-0 border-r border-[#e7e9f2] lg:block">{sidebar}</div>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button className="absolute inset-0 bg-black/32" type="button" aria-label="Close menu" onClick={onCloseMobileMenu} />
            <div className="relative h-full w-[min(320px,88vw)] shadow-2xl">{sidebar}</div>
          </div>
        )}

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b border-[#e7e9f2] bg-white/92 backdrop-blur-xl">
            <div className="flex h-16 items-center justify-between gap-3 px-4 lg:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <button className="grid size-10 place-items-center rounded-[8px] border border-[#e1e4ef] bg-white lg:hidden" type="button" aria-label="Open mobile menu" onClick={onOpenMobileMenu}>
                  <Menu className="size-5" aria-hidden="true" />
                </button>
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase text-[#6174f8]">Brand workspace</p>
                  <h1 className="truncate text-2xl font-black">{activeSection}</h1>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="hidden h-10 items-center gap-2 rounded-[8px] border border-[#e1e4ef] bg-white px-3 text-sm font-bold text-[#555866] sm:inline-flex" type="button" onClick={onOpenLifecycle}>
                  <ShieldCheck className="size-4" aria-hidden="true" />
                  Lifecycle
                </button>
                <button className="grid size-10 place-items-center rounded-[8px] border border-[#e1e4ef] bg-white" type="button" aria-label="Notifications" onClick={onOpenNotifications}>
                  <Bell className="size-4" aria-hidden="true" />
                </button>
                <button className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-[#6174f8] px-4 text-sm font-black text-white shadow-[0_10px_20px_rgba(76,91,210,0.24)]" type="button" onClick={onOpenCampaign}>
                  <Plus className="size-4" aria-hidden="true" />
                  New campaign
                </button>
              </div>
            </div>
          </header>

          <div className="px-4 py-5 lg:px-6">{children}</div>
        </section>
      </div>

      <button className="fixed bottom-5 right-5 z-40 grid size-12 place-items-center rounded-full bg-[#6174f8] text-white shadow-[0_10px_24px_rgba(76,91,210,0.36)]" type="button" aria-label="Open support chat" onClick={onOpenSupport}>
        <MessageSquare className="size-5" aria-hidden="true" />
      </button>
    </main>
  )
}
