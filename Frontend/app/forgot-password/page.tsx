"use client"

import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { FormEvent, useState } from "react"

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)

  function submitReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSent(true)
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f2ff] px-5 py-10 font-[Arial,Helvetica,sans-serif] text-[#141029]">
      <section className="w-full max-w-md rounded-[8px] border border-white/70 bg-white p-6 shadow-[0_24px_70px_rgba(92,79,190,0.18)]">
        <Link className="inline-flex items-center gap-2 text-sm font-black text-[#6e70ee]" href="/login">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to login
        </Link>
        <h1 className="mt-8 text-3xl font-black tracking-normal">Reset your password</h1>
        <p className="mt-3 text-sm font-medium leading-6 text-[#68637b]">
          Enter your account email and the backend reset flow can be connected here.
        </p>
        <form className="mt-6 grid gap-4" onSubmit={submitReset}>
          <label className="text-sm font-bold text-[#2a253f]" htmlFor="reset-email">
            Email
            <input
              id="reset-email"
              required
              className="mt-2 h-12 w-full rounded-[8px] border border-[#dedbec] bg-white px-4 text-sm font-medium outline-none transition focus:border-[#7a75f4] focus:ring-4 focus:ring-[#7a75f4]/14"
              placeholder="you@example.com"
              type="email"
            />
          </label>
          <button className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#7894ff] px-6 text-sm font-black text-white" type="submit">
            Send reset link
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </form>
        {sent && (
          <p className="mt-4 rounded-[8px] bg-[#eef1ff] px-4 py-3 text-sm font-bold text-[#5268df]">
            Reset request saved for the MVP preview. Backend email delivery can attach here.
          </p>
        )}
      </section>
    </main>
  )
}
