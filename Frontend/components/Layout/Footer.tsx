import Link from "next/link"
import { ArrowRight, Globe, Mail, MapPin, Send } from "lucide-react"

const footerLinks = [
  {
    title: "Platform",
    links: [
      { label: "Products", href: "/" },
      { label: "Pricing", href: "/pricing" },
      { label: "About", href: "/about" },
    ],
  },
  {
    title: "For teams",
    links: [
      { label: "Brands", href: "/login?role=brand" },
      { label: "Creators", href: "/login?role=creator" },
      { label: "Get started", href: "/register?role=brand" },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#080a12] font-[Arial,Helvetica,sans-serif] text-white">
      <div className="mx-auto grid w-[calc(100%-2rem)] max-w-[1200px] gap-10 px-1 py-12 md:grid-cols-[1.3fr_1fr] lg:py-14">
        <div>
          <Link href="/" className="inline-flex items-center gap-3" aria-label="Nepfluence home">
            <span className="relative grid size-9 rotate-[-35deg] grid-cols-3 gap-1 rounded-xl">
              {Array.from({ length: 9 }).map((_, index) => (
                <span
                  key={index}
                  className="rounded-full bg-[#7b7df8]"
                  style={{ opacity: index % 2 === 0 ? 1 : 0.62 }}
                />
              ))}
            </span>
            <span className="text-[1.45rem] font-black tracking-normal text-white">
              nepfluence
            </span>
          </Link>
          <p className="mt-5 max-w-md text-base font-medium leading-7 text-[#b8bdca]">
            Helping Nepali brands find creator fit, manage campaigns, and keep every collaboration moving clearly.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/register?role=brand"
              className="inline-flex items-center gap-2 rounded-full bg-[#7894ff] px-5 py-3 text-sm font-extrabold text-white shadow-[0_8px_18px_rgba(69,94,203,0.25)] transition hover:-translate-y-0.5 hover:bg-[#6f86f4]"
            >
              Start a campaign
              <ArrowRight className="size-4 stroke-[2.6]" aria-hidden="true" />
            </Link>
            <Link
              href="/login?role=creator"
              className="inline-flex items-center rounded-full border border-white/15 bg-white/8 px-5 py-3 text-sm font-extrabold text-white transition hover:border-white/25 hover:bg-white/12"
            >
              Join as creator
            </Link>
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h2 className="text-sm font-black uppercase tracking-normal text-[#90a2ff]">
                {group.title}
              </h2>
              <ul className="mt-4 space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm font-bold text-[#c7cad4] transition hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex w-[calc(100%-2rem)] max-w-[1200px] flex-col gap-4 px-1 py-5 text-sm font-bold text-[#aeb3c2] md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-5">
            <span>© {new Date().getFullYear()} Nepfluence. All rights reserved.</span>
            <span className="inline-flex items-center gap-2">
              <MapPin className="size-4 text-[#90a2ff]" aria-hidden="true" />
              Kathmandu, Nepal
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="mailto:hello@nepfluence.com"
              className="inline-flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/8 text-[#c7cad4] transition hover:border-white/25 hover:bg-white/12 hover:text-white"
              aria-label="Email Nepfluence"
            >
              <Mail className="size-4" aria-hidden="true" />
            </a>
            <a
              href="https://www.instagram.com/"
              className="inline-flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/8 text-[#c7cad4] transition hover:border-white/25 hover:bg-white/12 hover:text-white"
              aria-label="Nepfluence community"
            >
              <Send className="size-4" aria-hidden="true" />
            </a>
            <a
              href="https://www.linkedin.com/"
              className="inline-flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/8 text-[#c7cad4] transition hover:border-white/25 hover:bg-white/12 hover:text-white"
              aria-label="Nepfluence website"
            >
              <Globe className="size-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
