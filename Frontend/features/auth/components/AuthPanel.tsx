"use client"

import Link from "next/link"
import { ArrowRight, Building2, UserRound } from "lucide-react"
import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { mockLogin } from "@/lib/auth"
import type { AuthMode, UserRole } from "@/features/auth/types/auth.types"

type Role = Extract<UserRole, "brand" | "creator">

type AuthPanelProps = {
  mode: AuthMode
  role: Role
}

const roleCopy = {
  brand: {
    label: "Brand",
    icon: Building2,
    title: "Login as a Brand",
    registerTitle: "Create your brand account",
    description: "Manage campaigns, discover creators, and track content performance.",
  },
  creator: {
    label: "Creator",
    icon: UserRound,
    title: "Login as a Creator",
    registerTitle: "Create your creator account",
    description: "Find brand deals, submit content, and grow your creator profile.",
  },
}

export function normalizeRole(role?: string): Role {
  return role === "creator" ? "creator" : "brand"
}

export default function AuthPanel({ mode, role }: AuthPanelProps) {
  const router = useRouter()
  const active = roleCopy[role]
  const ActiveIcon = active.icon
  const isRegister = mode === "register"
  const alternateMode = isRegister ? "login" : "register"
  const title = isRegister ? active.registerTitle : active.title
  const [notice, setNotice] = useState("")

  function dashboardPath() {
    return role === "creator" ? "/creator/dashboard" : "/dashboard"
  }

  function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get("email") ?? "demo@nepfluence.com")

    mockLogin(role, email)
    setNotice(isRegister ? "Account created for the MVP preview. Opening workspace..." : "Login accepted for the MVP preview. Opening workspace...")
    router.push(dashboardPath())
  }

  function continueWithGoogle() {
    mockLogin(role)
    setNotice("Google sign-in is mocked for the MVP preview. Opening workspace...")
    router.push(dashboardPath())
  }

  return (
    <main className="min-h-screen bg-[#f4f2ff] px-5 py-8 font-[Arial,Helvetica,sans-serif] text-[#141029]">
      <Link href="/" className="mx-auto flex w-fit items-center gap-3 pb-8">
        <span className="relative grid size-9 rotate-[-35deg] grid-cols-3 gap-1 rounded-xl">
          {Array.from({ length: 9 }).map((_, index) => (
            <span
              key={index}
              className="rounded-full bg-[#7b7df8]"
              style={{ opacity: index % 2 === 0 ? 1 : 0.62 }}
            />
          ))}
        </span>
        <span className="text-2xl font-black tracking-[-0.02em] text-[#261559]">nepfluence</span>
      </Link>

      <section className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/70 bg-white shadow-[0_24px_70px_rgba(92,79,190,0.18)] lg:grid-cols-[0.88fr_1.12fr]">
        <div className="hidden bg-[#786cff] px-10 py-12 text-white lg:block">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/16 px-4 py-2 text-sm font-bold">
            <ActiveIcon className="size-4" aria-hidden="true" />
            {active.label} access
          </div>
          <h1 className="mt-10 max-w-sm text-5xl font-black leading-[0.98] tracking-[-0.04em]">
            Build better creator campaigns in Nepal.
          </h1>
          <p className="mt-5 max-w-sm text-base font-medium leading-7 text-white/82">
            {active.description}
          </p>
          <div className="mt-10 grid gap-3 text-sm font-bold text-white/90">
            <span className="rounded-2xl bg-white/14 px-4 py-3">Verified creators and brands</span>
            <span className="rounded-2xl bg-white/14 px-4 py-3">Campaign briefs, payments, and content in one place</span>
            <span className="rounded-2xl bg-white/14 px-4 py-3">Built for local influencer workflows</span>
          </div>
        </div>

        <div className="px-6 py-8 sm:px-10 sm:py-12">
          <div className="grid grid-cols-2 gap-2 rounded-full bg-[#f1efff] p-1">
            {(["brand", "creator"] as const).map((item) => {
              const Icon = roleCopy[item].icon

              return (
                <Link
                  key={item}
                  href={`/${mode}?role=${item}`}
                  className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-extrabold transition ${
                    role === item
                      ? "bg-white text-[#241655] shadow-[0_8px_18px_rgba(87,79,163,0.14)]"
                      : "text-[#615d76] hover:text-[#241655]"
                  }`}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {roleCopy[item].label}
                </Link>
              )
            })}
          </div>

          <div className="mt-9">
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#7a75f4]">
              {isRegister ? "Start free" : "Welcome back"}
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-[#141029] sm:text-4xl">
              {title}
            </h2>
            <p className="mt-3 text-sm font-medium leading-6 text-[#68637b]">{active.description}</p>
          </div>

          <form className="mt-8 grid gap-4" onSubmit={submitAuth}>
            {isRegister && (
              <div>
                <label className="text-sm font-bold text-[#2a253f]" htmlFor="name">
                  {role === "brand" ? "Company name" : "Creator name"}
                </label>
                <input
                  id="name"
                  required
                  className="mt-2 h-12 w-full rounded-2xl border border-[#dedbec] bg-white px-4 text-sm font-medium outline-none transition focus:border-[#7a75f4] focus:ring-4 focus:ring-[#7a75f4]/14"
                  placeholder={role === "brand" ? "Your brand name" : "Your full name"}
                  type="text"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-bold text-[#2a253f]" htmlFor="email">
                Email
              </label>
                <input
                  id="email"
                  name="email"
                  required
                className="mt-2 h-12 w-full rounded-2xl border border-[#dedbec] bg-white px-4 text-sm font-medium outline-none transition focus:border-[#7a75f4] focus:ring-4 focus:ring-[#7a75f4]/14"
                placeholder="you@example.com"
                type="email"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-[#2a253f]" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                required
                className="mt-2 h-12 w-full rounded-2xl border border-[#dedbec] bg-white px-4 text-sm font-medium outline-none transition focus:border-[#7a75f4] focus:ring-4 focus:ring-[#7a75f4]/14"
                placeholder="Enter your password"
                type="password"
              />
            </div>

            {isRegister && (
              <div>
                <label className="text-sm font-bold text-[#2a253f]" htmlFor="phone">
                  {role === "brand" ? "Business website" : "Instagram or TikTok handle"}
                </label>
                <input
                  id="phone"
                  required
                  className="mt-2 h-12 w-full rounded-2xl border border-[#dedbec] bg-white px-4 text-sm font-medium outline-none transition focus:border-[#7a75f4] focus:ring-4 focus:ring-[#7a75f4]/14"
                  placeholder={role === "brand" ? "https://yourbrand.com" : "@yourhandle"}
                  type="text"
                />
              </div>
            )}

            {!isRegister && (
              <div className="flex items-center justify-between gap-3 text-sm">
                <label className="flex items-center gap-2 font-semibold text-[#68637b]">
                  <input className="size-4 rounded border-[#dedbec] accent-[#786cff]" type="checkbox" />
                  Remember me
                </label>
                <Link className="font-extrabold text-[#6e70ee] hover:text-[#4f55d6]" href="/forgot-password">
                  Forgot password?
                </Link>
              </div>
            )}

            <button
              className="mt-2 inline-flex h-13 items-center justify-center gap-2 rounded-full bg-[#7894ff] px-6 text-[15px] font-black text-white shadow-[0_10px_22px_rgba(69,94,203,0.32)] transition hover:-translate-y-0.5 hover:bg-[#6f86f4]"
              type="submit"
            >
              {isRegister ? `Create ${active.label} Account` : `Login as ${active.label}`}
              <ArrowRight className="size-4 stroke-[2.7]" aria-hidden="true" />
            </button>
          </form>

          {notice && (
            <p className="mt-4 rounded-[8px] bg-[#eef1ff] px-4 py-3 text-sm font-bold text-[#5268df]">
              {notice}
            </p>
          )}

          <div className="my-7 flex items-center gap-3">
            <span className="h-px flex-1 bg-[#ebe8f6]" />
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#918ca5]">or</span>
            <span className="h-px flex-1 bg-[#ebe8f6]" />
          </div>

          <button className="h-12 w-full rounded-full border border-[#dedbec] bg-white text-sm font-extrabold text-[#241655] transition hover:bg-[#f8f7ff]" type="button" onClick={continueWithGoogle}>
            Continue with Google
          </button>

          <p className="mt-7 text-center text-sm font-medium text-[#68637b]">
            {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
            <Link className="font-black text-[#6e70ee] hover:text-[#4f55d6]" href={`/${alternateMode}?role=${role}`}>
              {isRegister ? "Login" : "Sign up free"}
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}
