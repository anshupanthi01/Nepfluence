const steps = [
  { step: "01", title: "Create your profile", desc: "Sign up as a brand or creator. Complete KYC once — verified for all future campaigns." },
  { step: "02", title: "Match & collaborate", desc: "Brands post campaigns. Creators apply. Smart matching surfaces the best fit." },
  { step: "03", title: "Get paid securely", desc: "Funds held in escrow. Released automatically when deliverables are approved." },
]

export default function HowItWorks() {
  return (
    <section className="py-24 bg-gray-50 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
          How it works
        </h2>
        <p className="text-center text-gray-500 mb-16">
          Simple steps to launch your first campaign
        </p>
        <div className="grid grid-cols-3 gap-10">
          {steps.map((item) => (
            <div key={item.step} className="flex flex-col items-start">
              <span className="text-4xl font-bold text-blue-100">{item.step}</span>
              <h3 className="mt-2 text-lg font-semibold text-gray-900">{item.title}</h3>
              <p className="mt-2 text-gray-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}