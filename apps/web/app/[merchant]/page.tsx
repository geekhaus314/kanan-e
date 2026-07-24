import { getTenantBySlug } from "@/lib/tenant";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CartBadge } from "@/components/CartBadge";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default async function MerchantHome({
  params,
}: {
  params: Promise<{ merchant: string }>;
}) {
  const { merchant } = await params;
  const tenant = await getTenantBySlug(merchant);
  const session = await auth();

  if (!tenant) notFound();

  return (
    <main className="min-h-screen bg-gradient-surface">
      <div className="fixed inset-0 hero-radial pointer-events-none" />
      <div className="fixed inset-0 grid-pattern pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="flex h-20 items-center justify-between border-b border-white/5">
          <Link
            href={`/${merchant}`}
            className="flex items-center gap-3 group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand badge-glow transition-transform group-hover:scale-105">
              <span className="text-base font-black text-gray-900">UD</span>
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-bold tracking-tight text-gray-100">
                United Distribution
              </div>
              <div className="text-[10px] tracking-widest uppercase text-gray-500">
                Wholesale Platform
              </div>
            </div>
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href={`/${merchant}/products`}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 transition-colors hover:text-amber-400"
            >
              Products
            </Link>
            <Link
              href={`/${merchant}/cart`}
              className="relative flex items-center rounded-lg px-4 py-2 text-sm font-medium text-gray-400 transition-colors hover:text-amber-400"
            >
              Cart
              <CartBadge />
            </Link>
            {session?.user ? (
              <Link
                href={`/${merchant}/account`}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 transition-colors hover:text-amber-400"
              >
                Account
              </Link>
            ) : (
              <Link
                href={`/${merchant}/auth/signin`}
                className="btn-premium rounded-lg px-5 py-2 text-sm"
              >
                Sign In
              </Link>
            )}
            <LanguageSwitcher />
          </nav>
        </header>

        <section className="mx-auto mt-20 max-w-5xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-4 py-1.5 text-xs font-semibold tracking-wider uppercase text-amber-400">
            Est. 2024 — United Distribution
          </span>
          <h1 className="mt-6 text-5xl font-black tracking-tight text-gray-50 sm:text-6xl lg:text-7xl">
            Wholesale Tobacco,
            <br />
            <span className="text-gradient">Vape & Accessories</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400 sm:text-xl">
            Premium bulk products for verified businesses. Competitive tier-based
            pricing with fast, reliable fulfillment across the United States.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={`/${merchant}/products`}
              className="btn-premium inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base"
            >
              Browse Catalog →
            </Link>
            {session?.user ? (
              <Link
                href={`/${merchant}/cart`}
                className="btn-outline inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base"
              >
                View Cart
              </Link>
            ) : (
              <Link
                href={`/${merchant}/auth/signin`}
                className="btn-outline inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base"
              >
                Sign In to Order
              </Link>
            )}
          </div>
        </section>

        <section className="mx-auto mt-24 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="card-premium scroll-reveal rounded-2xl p-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 text-xl">
              💎
            </div>
            <h3 className="text-base font-bold text-gray-100">
              Premium Product Line
            </h3>
            <p className="mt-2 text-sm text-gray-400 leading-relaxed">
              Curated tobacco, vape, and accessories from top manufacturers.
              Every product verified and compliant.
            </p>
          </div>
          <div className="card-premium scroll-reveal rounded-2xl p-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 text-xl">
              📊
            </div>
            <h3 className="text-base font-bold text-gray-100">
              Volume Pricing Tiers
            </h3>
            <p className="mt-2 text-sm text-gray-400 leading-relaxed">
              Scale your business with incremental savings. Higher volume,
              better margins — designed for growth.
            </p>
          </div>
          <div className="card-premium scroll-reveal rounded-2xl p-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 text-xl">
              🛡️
            </div>
            <h3 className="text-base font-bold text-gray-100">
              Compliance First
            </h3>
            <p className="mt-2 text-sm text-gray-400 leading-relaxed">
              Built-in age verification, license tracking, and audit-ready
              records for total peace of mind.
            </p>
          </div>
        </section>

        <section className="mx-auto mt-24 py-16">
          <div className="section-divider w-24 mx-auto mb-12" />
          <h2 className="text-3xl font-black text-gray-100 sm:text-4xl">
            Why United Distribution?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-gray-400">
            Headquartered in St. Louis, MO — your trusted wholesale partner
            for the smoke shop and convenience trade.
          </p>
          <div className="mt-12 grid max-w-3xl mx-auto grid-cols-1 gap-8 sm:grid-cols-2">
            {[
              {
                icon: "🏢",
                title: "Licensed & Insured",
                desc: "Fully compliant Missouri DBA operating since 2024. Federally registered tobacco licensing.",
              },
              {
                icon: "🚚",
                title: "Fast Fulfillment",
                desc: "Orders processed within 24 hours. Reliable shipping across all 50 states.",
              },
              {
                icon: "🤝",
                title: "Dedicated Support",
                desc: "Personal account management for wholesale partners. Responsive and knowledgeable.",
              },
              {
                icon: "🔐",
                title: "Secure & Private",
                desc: "Your business data and order history are protected and confidential.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="card-premium scroll-reveal rounded-2xl p-6"
              >
                <div className="text-2xl mb-3">{item.icon}</div>
                <h3 className="text-base font-bold text-gray-100">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-24 text-center">
          <div className="section-divider w-24 mx-auto mb-12" />
          <h2 className="text-3xl font-black text-gray-100 sm:text-4xl">
            Ready to Partner?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-gray-400">
            Sign in to access wholesale pricing and place your first order. New
            accounts approved within 1 business day.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {session?.user ? (
              <Link
                href={`/${merchant}/products`}
                className="btn-premium inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base"
              >
                Browse Products →
              </Link>
            ) : (
              <Link
                href={`/${merchant}/auth/signin`}
                className="btn-premium inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base"
              >
                Sign In to Partner
              </Link>
            )}
            <Link
              href={`/${merchant}/wholesale`}
              className="btn-outline inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base"
            >
              Apply for Wholesale →
            </Link>
          </div>
        </section>

        <footer className="mt-24 border-t border-white/5 py-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-brand text-sm font-black text-gray-900">
              UD
            </div>
            <span className="text-sm font-semibold text-gray-500">
              United Distribution
            </span>
          </div>
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} Kanan Enterprises LLC. All rights
            reserved.
          </p>
        </footer>
      </div>
    </main>
  );
}
