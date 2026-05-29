import Link from "next/link"
import { ArrowRight, ChevronDown } from "lucide-react"

const dropdownItems = ["Products", "Solutions", "Countries", "Resources"]

export default function Navbar() {
  return (
    <>
      <div className="bg-[#8090ff] px-4 py-3 text-center text-sm font-extrabold text-white shadow-sm sm:text-base">
        NEW: Campaign matcher is here - find creator fit faster.
        <Link href="/register?role=brand" className="ml-3 inline-flex items-center gap-1 underline underline-offset-4">
          See it in action <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
      <header className="sticky inset-x-0 top-0 z-50 py-2 font-[Arial,Helvetica,sans-serif] backdrop-blur-sm">
        <nav className="mx-auto flex min-h-[72px] w-[calc(100%-2rem)] max-w-[1200px] items-center justify-between gap-3 rounded-full border border-white/70 bg-white/88 px-5 py-3 shadow-[0_18px_50px_rgba(92,87,156,0.18)] backdrop-blur-xl sm:px-7 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="Nepfluence home">
            <span className="relative grid size-9 rotate-[-35deg] grid-cols-3 gap-1 rounded-xl">
              {Array.from({ length: 9 }).map((_, index) => (
                <span
                  key={index}
                  className="rounded-full bg-[#7b7df8]"
                  style={{ opacity: index % 2 === 0 ? 1 : 0.62 }}
                />
              ))}
            </span>
            <span className="text-[1.45rem] font-black tracking-normal text-[#261559]">
              nepfluence
            </span>
          </Link>

          <div className="hidden flex-1 items-center gap-4 lg:flex">
            {dropdownItems.map((item) => (
              <button
                key={item}
                className="inline-flex items-center gap-1 text-[15px] font-semibold text-black transition hover:text-[#6174f8]"
                type="button"
              >
                {item}
                <ChevronDown className="size-4 stroke-[2.5]" aria-hidden="true" />
              </button>
            ))}
            <Link className="text-[15px] font-semibold text-black transition hover:text-[#5f6df6]" href="/pricing">
              Pricing
            </Link>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              className="whitespace-nowrap text-[15px] font-semibold text-black transition hover:text-[#5f6df6]"
              href="/login?role=creator"
            >
              For Creators
            </Link>
            <Link
              className="whitespace-nowrap rounded-full border border-black/10 bg-white px-6 py-4 text-[15px] font-extrabold text-black shadow-[0_5px_14px_rgba(31,28,64,0.16)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(31,28,64,0.2)]"
              href="/login?role=brand"
            >
              Login as a Brand
            </Link>
            <Link
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-[#5471d8] bg-[#7894ff] px-6 py-4 text-[15px] font-extrabold text-white shadow-[0_8px_18px_rgba(69,94,203,0.35)] transition hover:-translate-y-0.5 hover:bg-[#6f86f4]"
              href="/register?role=brand"
            >
              Get Started
              <ArrowRight className="size-4 stroke-[2.6]" aria-hidden="true" />
            </Link>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <Link
              className="rounded-full bg-white px-4 py-3 text-sm font-extrabold text-black shadow-[0_5px_14px_rgba(31,28,64,0.14)]"
              href="/login?role=brand"
            >
              Login
            </Link>
            <Link
              className="inline-flex size-11 items-center justify-center rounded-full bg-[#7894ff] text-white shadow-[0_8px_18px_rgba(69,94,203,0.32)]"
              href="/register?role=brand"
              aria-label="Get started"
            >
              <ArrowRight className="size-5" aria-hidden="true" />
            </Link>
          </div>
        </nav>
      </header>
    </>
  )
}
