export default function PlatformLanding() {
  return (
    <main className="min-h-screen bg-gradient-surface">
      <div className="hero-radial-strong fixed inset-0 pointer-events-none" />
      <div className="grid-pattern fixed inset-0 pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="flex h-20 items-center justify-between border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand badge-glow">
              <span className="text-base font-black text-gray-900">K</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-100">
              KananOS
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/united"
              className="btn-premium inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm"
            >
              Visit United Distribution →
            </a>
          </div>
        </header>

        <section className="mx-auto mt-24 max-w-4xl text-center">
          <div className="animate-fade-in-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold tracking-wider uppercase text-amber-400">
              Enterprise Wholesale Platform
            </span>
          </div>
          <h1 className="mt-6 text-5xl font-black tracking-tight text-gray-50 sm:text-6xl lg:text-7xl xl:text-8xl">
            Wholesale at
            <span className="text-gradient"> Scale.</span>
            <br />
            Sourced for Business.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400 sm:text-xl">
            Premium tobacco, vape, and accessories — delivered in bulk to
            businesses that demand quality. Tiered pricing built to grow with
            your operation.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="/united"
              className="btn-premium inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base"
            >
              Explore United Distribution →
            </a>
            <a
              href="/united/products"
              className="btn-outline inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base"
            >
              Browse Catalog
            </a>
          </div>
        </section>

        <section className="mx-auto mt-24 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="card-premium scroll-reveal rounded-2xl p-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 text-xl">
              ⚡
            </div>
            <h3 className="text-base font-bold text-gray-100">
              Tiered Bulk Pricing
            </h3>
            <p className="mt-2 text-sm text-gray-400 leading-relaxed">
              Volume discounts that reward your growth. The more you order, the
              more you save.
            </p>
          </div>
          <div className="card-premium scroll-reveal rounded-2xl p-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 text-xl">
              🔒
            </div>
            <h3 className="text-base font-bold text-gray-100">
              Verified & Compliant
            </h3>
            <p className="mt-2 text-sm text-gray-400 leading-relaxed">
              Every product meets strict quality standards. Age verification for
              restricted items built in.
            </p>
          </div>
          <div className="card-premium scroll-reveal rounded-2xl p-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 text-xl">
              🚀
            </div>
            <h3 className="text-base font-bold text-gray-100">
              Fast Fulfillment
            </h3>
            <p className="mt-2 text-sm text-gray-400 leading-relaxed">
              Orders processed and shipped promptly. Your business stays stocked
              and ready.
            </p>
          </div>
        </section>

        <section className="mx-auto mt-24 text-center">
          <div className="section-divider w-24 mx-auto mb-12" />
          <h2 className="text-3xl font-black text-gray-100 sm:text-4xl">
            Trusted by Businesses Nationwide
          </h2>
          <p className="mx-auto mt-4 text-gray-400">
            United Distribution — a premier wholesale partner for tobacco, vape,
            and accessories.
          </p>
          <div className="mt-12 grid max-w-2xl mx-auto grid-cols-2 gap-8 sm:grid-cols-4">
            {[
              { label: "Product Lines", value: "500+" },
              { label: "Active Buyers", value: "US-Based" },
              { label: "Compliance", value: "21+ Verified" },
              { label: "Location", value: "St. Louis" },
            ].map((stat, i) => (
              <div key={i} className="scroll-reveal">
                <div className="text-2xl font-black text-amber-400">
                  {stat.value}
                </div>
                <div className="mt-1 text-xs text-gray-500 uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-24 border-t border-border/50 py-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-brand text-sm font-black text-gray-900">
              K
            </div>
            <span className="text-sm font-semibold text-gray-500">
              Kanan Enterprises LLC
            </span>
          </div>
          <p className="text-xs text-gray-600">
            DBA United Distribution. All rights reserved.
          </p>
        </footer>
      </div>
    </main>
  );
}
