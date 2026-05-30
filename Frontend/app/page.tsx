import HeroSection from "../features/home/HeroSection"
import HowItWorks from "../features/home/HowItWork"
import Navbar from "@/components/Layout/Navbar"

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <HowItWorks />
      {/* <StatsSection /> */}

      {/* CALL TO ACTION */}
      <section className="py-24 bg-white px-6 text-center">
        <h2 className="text-4xl font-bold text-gray-900 max-w-xl mx-auto">
          Ready to grow your brand in Nepal?
        </h2>
        <p className="mt-4 text-gray-500 max-w-md mx-auto">
          Join thousands of brands and creators already using InfluenceNP.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <a href="/register?role=brand"
            className="px-8 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition">
            Start for free
          </a>
          <a href="/about"
            className="px-8 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition">
            Learn more
          </a>
        </div>
      </section>
    </main>
  )
}
