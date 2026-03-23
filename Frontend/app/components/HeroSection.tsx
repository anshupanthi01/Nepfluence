export default function HeroSection() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-white">
      <div className="mb-6 px-4 py-1.5 bg-blue-50 text-blue-600 text-sm font-medium rounded-full">
        🇳🇵 Built for Nepal & India
      </div>
      <h1 className="text-5xl font-bold text-gray-900 max-w-3xl leading-tight">
        Connect Brands with the
        <span className="text-blue-600"> Right Influencers</span>
      </h1>
      <p className="mt-6 text-xl text-gray-500 max-w-xl">
        The smartest influencer marketing platform for Nepal and India.
        Verified creators, secure escrow, real results.
      </p>
      <div className="mt-10 flex gap-4">
        <a href="/register?type=brand"
          className="px-8 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition">
          I am a Brand
        </a>
        <a href="/register?type=influencer"
          className="px-8 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition">
          I am a Creator
        </a>
      </div>
      <p className="mt-8 text-sm text-gray-400">
        Free to join · Secure payments · Verified influencers
      </p>
    </section>
  )
}