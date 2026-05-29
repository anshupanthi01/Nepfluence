import type { ReactNode } from "react"
import { ArrowRight, BadgeCheck, Coins, Globe2, Infinity, MapPin, Star } from "lucide-react"

const creatorVideos = [
  {
    brand: "Himal Glow",
    creator: "Aarati",
    location: "Kathmandu",
    tag: "Testimonial",
    flag: "NP",
    poster: "https://images.unsplash.com/photo-1598550874175-4d0ef436c909?auto=format&fit=crop&w=600&q=80",
    video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  },
  {
    brand: "Trail Tea",
    creator: "Nischal",
    location: "Pokhara",
    tag: "B-roll",
    flag: "NP",
    poster: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
    video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  },
  {
    brand: "Aura Wear",
    creator: "Sanya",
    location: "Delhi",
    tag: "Unboxing",
    flag: "IN",
    poster: "https://images.unsplash.com/photo-1606814893907-c2e42943c91f?auto=format&fit=crop&w=600&q=80",
    video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
  },
  {
    brand: "Cafe Momo",
    creator: "Pratik",
    location: "Lalitpur",
    tag: "Food Reel",
    flag: "NP",
    poster: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=600&q=80",
    video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  },
  {
    brand: "Serene Skin",
    creator: "Mira",
    location: "Bengaluru",
    tag: "Voiceover",
    flag: "IN",
    poster: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80",
    video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
  },
  {
    brand: "Urban Gear",
    creator: "Kabir",
    location: "Mumbai",
    tag: "Meta Ad",
    flag: "IN",
    poster: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80",
    video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
  },
]

const repeatedVideos = [...creatorVideos, ...creatorVideos]

export default function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,#eef3ff_0%,#ffffff_48%,#d9d1ff_100%)] pt-16 text-center font-[Arial,Helvetica,sans-serif] sm:pt-20 lg:pt-24">
      <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_12%_0%,rgba(111,132,255,0.2),transparent_28%),radial-gradient(circle_at_88%_8%,rgba(168,143,255,0.22),transparent_24%)]" />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-5">
        <div className="inline-flex max-w-full flex-wrap items-center justify-center gap-1.5 rounded-full bg-white/86 px-4 py-2 text-xs font-extrabold text-black shadow-[0_8px_28px_rgba(54,50,100,0.12)] ring-1 ring-black/5 sm:gap-2 sm:px-5 sm:text-[15px]">
          <BadgeCheck className="size-4 fill-[#7894ff] text-white sm:size-5" aria-hidden="true" />
          <span>Get creators from Nepal</span>
          <span className="hidden sm:inline">-</span>
          {/* <span className="inline-flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star key={index} className="size-3.5 fill-[#f7b733] text-[#f7b733] sm:size-4" aria-hidden="true" />
            ))}
            4.9 rating
          </span> */}
        </div>

        <h1 className="mt-6 max-w-[1180px] text-[2.15rem] font-black leading-[1.08] tracking-normal text-black sm:text-[2.9rem] lg:text-[2.75rem] xl:whitespace-nowrap xl:text-[2.65rem]">
          Get influencer UGC video ads that convert, fast!
        </h1>

        <p className="mt-5 max-w-3xl text-base font-medium leading-7 text-black sm:text-lg lg:text-xl">
          We match brands with verified creators so campaigns feel local, move quickly, and produce content people trust.
        </p>
{/* 
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <HeroBadge icon={<Coins className="size-5 text-[#f7b733]" aria-hidden="true" />} text="UGC videos starting at NPR 8,999" />
          <HeroBadge icon={<Globe2 className="size-5 text-[#4b74ff]" aria-hidden="true" />} text="10,000+ creators across Nepal and India" />
          <HeroBadge icon={<Infinity className="size-5 text-[#7d45ff]" aria-hidden="true" />} text="Unlimited revisions and usage rights" />
        </div> */}

        <a
          href="/register?role=brand"
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#5471d8] bg-[#7894ff] px-7 py-3.5 text-[15px] font-extrabold text-white shadow-[0_12px_24px_rgba(69,94,203,0.34)] transition hover:-translate-y-0.5 hover:bg-[#6f86f4] sm:px-8 sm:py-4 sm:text-base"
        >
          Get Started <ArrowRight className="size-5" aria-hidden="true" />
        </a>
      </div>

      <div className="relative z-10 mt-8 w-full overflow-hidden pb-9">
        <div className="hero-video-marquee flex w-max gap-5 px-5">
          {repeatedVideos.map((item, index) => (
            <article
              key={`${item.brand}-${index}`}
              className="relative h-[332px] w-[192px] shrink-0 overflow-hidden rounded-[8px] bg-white shadow-[0_10px_24px_rgba(34,32,56,0.14)] ring-1 ring-black/5 sm:h-[386px] sm:w-[220px]"
            >
              <video
                className="h-full w-full object-cover"
                autoPlay
                loop
                muted
                playsInline
                preload="none"
                poster={item.poster}
                src={item.video}
              />
              <div className="absolute inset-x-0 top-0 flex items-center justify-between p-2.5">
                <span className="max-w-[132px] truncate rounded-full bg-white px-2.5 py-1 text-[11px] font-black leading-none text-black shadow">
                  {item.brand}
                </span>
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/38 via-black/10 to-transparent" />
              <span className="absolute bottom-[46px] left-2.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-black leading-none text-black shadow">
                {item.tag}
              </span>
              <div className="absolute inset-x-0 bottom-0 flex h-10 items-center gap-2 rounded-b-[8px] bg-white/96 px-2.5 shadow-[0_-6px_18px_rgba(20,18,40,0.08)]">
                <div className="grid size-6 shrink-0 place-items-center rounded-full bg-[#e9edff] text-[10px] font-black text-[#5368e8]">
                  {item.creator.charAt(0)}
                </div>
                <div className="min-w-0 flex-1 text-left leading-none">
                  <div className="truncate text-[11px] font-black text-black">{item.creator}</div>
                  <div className="mt-1 flex items-center gap-1 truncate text-[10px] font-bold text-[#a8afbd]">
                    <MapPin className="size-3 fill-[#c5cad4] text-[#c5cad4]" aria-hidden="true" />
                    <span className="truncate">{item.location}</span>
                  </div>
                </div>
                <span className="shrink-0 text-[11px] font-black text-[#6a7280]">{item.flag}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function HeroBadge({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="inline-flex max-w-full items-center gap-2 rounded-[8px] bg-white/88 px-3 py-2 text-xs font-black text-black shadow-[0_8px_22px_rgba(54,50,100,0.12)] ring-1 ring-black/5 sm:px-4 sm:text-sm lg:text-[15px]">
      {icon}
      <span className="truncate">{text}</span>
    </div>
  )
}
