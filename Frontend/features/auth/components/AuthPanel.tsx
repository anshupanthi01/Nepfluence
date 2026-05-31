"use client"

import Link from "next/link"
import { ArrowRight, Building2, UserRound } from "lucide-react"
import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { login, nextRouteForSession, register } from "@/lib/auth"
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
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get("email") ?? "demo@nepfluence.com")
    const password = String(form.get("password") ?? "")
    const username = String(form.get("name") ?? email.split("@")[0])

    setError("")
    setNotice("")
    setIsSubmitting(true)

    try {
      const session = isRegister
        ? await register({
            username,
            email,
            password,
            role,
            country: "NP",
          })
        : await login({ email, password, roleHint: role })

      if (isRegister) {
        setNotice("Account created. Opening workspace...")
      } else {
        setNotice("Login accepted. Opening workspace...")
      }

      router.push(nextRouteForSession(session))
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Authentication failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  function continueWithGoogle() {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/auth/google`
  }

  return (
    <main className="min-h-screen bg-[#f5f3ef] px-5 py-8 font-sans text-[#1f252b]">
      <Link href="/" className="mx-auto flex w-fit items-center gap-3 pb-8">
        <span className="relative grid size-9 rotate-[-35deg] grid-cols-3 gap-1 rounded-xl">
          {Array.from({ length: 9 }).map((_, index) => (
            <span
              key={index}
              className="rounded-full bg-[#1f252b]"
              style={{ opacity: index % 2 === 0 ? 1 : 0.34 }}
            />
          ))}
        </span>
        <span className="text-xl font-black tracking-tight text-[#1f252b]">nepfluence</span>
      </Link>

      <section className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-[#e8e2d9] bg-[#fbfaf7] shadow-[0_24px_70px_rgba(31,37,43,0.12)] lg:grid-cols-[0.88fr_1.12fr]">
        <div className="hidden bg-[#eee8df] px-10 py-12 text-[#1f252b] lg:block">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black">
            <ActiveIcon className="size-4" aria-hidden="true" />
            {active.label} access
          </div>
          <h1 className="mt-10 max-w-sm text-5xl font-black leading-[0.98] tracking-[-0.04em]">
            Build better creator campaigns in Nepal.
          </h1>
          <p className="mt-5 max-w-sm text-base font-medium leading-7 text-[#69716b]">
            {active.description}
          </p>
          <div className="mt-10 grid gap-3 text-sm font-semibold text-[#505852]">
            <span className="rounded-[20px] bg-white px-4 py-3">Verified creators and brands</span>
            <span className="rounded-[20px] bg-white px-4 py-3">Campaign briefs, payments, and content in one place</span>
            <span className="rounded-[20px] bg-white px-4 py-3">Built for local influencer workflows</span>
          </div>
        </div>

        <div className="px-6 py-8 sm:px-10 sm:py-12">
          <div className="grid grid-cols-2 gap-2 rounded-full bg-[#f0ece5] p-1">
            {(["brand", "creator"] as const).map((item) => {
              const Icon = roleCopy[item].icon

              return (
                <Link
                  key={item}
                  href={`/${mode}?role=${item}`}
                  className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-extrabold transition ${
                    role === item
                      ? "bg-white text-[#1f252b] shadow-[0_8px_18px_rgba(31,37,43,0.08)]"
                      : "text-[#69716b] hover:text-[#1f252b]"
                  }`}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {roleCopy[item].label}
                </Link>
              )
            })}
          </div>

          <div className="mt-9">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#8a8175]">
              {isRegister ? "Start free" : "Welcome back"}
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-[#1f252b] sm:text-4xl">
              {title}
            </h2>
            <p className="mt-3 text-sm font-medium leading-6 text-[#69716b]">{active.description}</p>
          </div>

          <form className="mt-8 grid gap-4" onSubmit={submitAuth}>
            {isRegister && (
              <div>
                <label className="text-sm font-bold text-[#505852]" htmlFor="name">
                  {role === "brand" ? "Company name" : "Creator name"}
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  className="mt-2 h-12 w-full rounded-[18px] border border-[#ded8cf] bg-white px-4 text-sm font-medium outline-none transition focus:border-[#1f252b] focus:ring-4 focus:ring-[#1f252b]/5"
                  placeholder={role === "brand" ? "Your brand name" : "Your full name"}
                  type="text"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-bold text-[#505852]" htmlFor="email">
                Email
              </label>
                <input
                  id="email"
                  name="email"
                  required
                className="mt-2 h-12 w-full rounded-[18px] border border-[#ded8cf] bg-white px-4 text-sm font-medium outline-none transition focus:border-[#1f252b] focus:ring-4 focus:ring-[#1f252b]/5"
                placeholder="you@example.com"
                type="email"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-[#505852]" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                required
                minLength={8}
                className="mt-2 h-12 w-full rounded-[18px] border border-[#ded8cf] bg-white px-4 text-sm font-medium outline-none transition focus:border-[#1f252b] focus:ring-4 focus:ring-[#1f252b]/5"
                placeholder="Enter your password"
                type="password"
              />
            </div>

            {isRegister && (
              <div>
                <label className="text-sm font-bold text-[#505852]" htmlFor="phone">
                  {role === "brand" ? "Business website" : "Instagram or TikTok handle"}
                </label>
                <input
                  id="phone"
                  required
                  className="mt-2 h-12 w-full rounded-[18px] border border-[#ded8cf] bg-white px-4 text-sm font-medium outline-none transition focus:border-[#1f252b] focus:ring-4 focus:ring-[#1f252b]/5"
                  placeholder={role === "brand" ? "https://yourbrand.com" : "@yourhandle"}
                  type="text"
                />
              </div>
            )}

            {!isRegister && (
              <div className="flex items-center justify-between gap-3 text-sm">
                <label className="flex items-center gap-2 font-semibold text-[#69716b]">
                  <input className="size-4 rounded border-[#ded8cf] accent-[#1f252b]" type="checkbox" />
                  Remember me
                </label>
                <Link className="font-extrabold text-[#1f252b] hover:text-[#505852]" href="/forgot-password">
                  Forgot password?
                </Link>
              </div>
            )}

            <button
              disabled={isSubmitting}
              className="mt-2 inline-flex h-13 items-center justify-center gap-2 rounded-full bg-[#1f252b] px-6 text-[15px] font-black text-white shadow-[0_10px_22px_rgba(31,37,43,0.18)] transition hover:-translate-y-0.5 hover:bg-[#303840]"
              type="submit"
            >
              {isSubmitting ? "Please wait..." : isRegister ? `Create ${active.label} Account` : `Login as ${active.label}`}
              <ArrowRight className="size-4 stroke-[2.7]" aria-hidden="true" />
            </button>
          </form>

          {error && (
            <p className="mt-4 rounded-[8px] bg-[#fff0f0] px-4 py-3 text-sm font-bold text-[#b42318]">
              {error}
            </p>
          )}

          {notice && (
            <p className="mt-4 rounded-[16px] bg-[#f0ece5] px-4 py-3 text-sm font-bold text-[#1f252b]">
              {notice}
            </p>
          )}

          <div className="my-7 flex items-center gap-3">
            <span className="h-px flex-1 bg-[#e8e2d9]" />
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a8175]">or</span>
            <span className="h-px flex-1 bg-[#e8e2d9]" />
          </div>

          <button className="h-12 w-full rounded-full border border-[#ded8cf] bg-white text-sm font-extrabold text-[#1f252b] transition hover:bg-[#f5f1ea]" type="button" onClick={continueWithGoogle}>
            Continue with Google
          </button>

          <p className="mt-7 text-center text-sm font-medium text-[#69716b]">
            {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
            <Link className="font-black text-[#1f252b] hover:text-[#505852]" href={`/${alternateMode}?role=${role}`}>
              {isRegister ? "Login" : "Sign up free"}
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}
