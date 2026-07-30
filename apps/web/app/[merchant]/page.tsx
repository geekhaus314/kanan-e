import { getTenantBySlug } from "@/lib/tenant";
import { auth } from "@/lib/auth";
import { db, schema } from "@kananos/database";
import { notFound } from "next/navigation";
import Link from "next/link";
import { eq, and, asc, desc } from "drizzle-orm";

const categoryIcons: Record<string, string> = {
  cigarettes: "🚬",
  cigars: "🫒",
  "pipe-tobacco": "🪵",
  vape: "💨",
  "nicotine-pouches": "🟢",
  glassware: "🔮",
  accessories: "🛠️",
  "cbd-hemp": "🌿",
  "candy-snacks": "🍬",
  beverages: "🥤",
  general: "📦",
};

const categoryGradients: Record<string, string> = {
  cigarettes: "from-red-600/20 to-red-900/10",
  cigars: "from-amber-700/20 to-amber-900/10",
  "pipe-tobacco": "from-stone-600/20 to-stone-800/10",
  vape: "from-cyan-500/20 to-blue-600/10",
  "nicotine-pouches": "from-green-500/20 to-green-700/10",
  glassware: "from-purple-500/20 to-violet-600/10",
  accessories: "from-gray-500/20 to-gray-700/10",
  "cbd-hemp": "from-lime-500/20 to-green-600/10",
  "candy-snacks": "from-pink-500/20 to-rose-600/10",
  beverages: "from-sky-500/20 to-blue-600/10",
  general: "from-orange-500/20 to-orange-700/10",
};

export default async function MerchantHome({
  params,
}: {
  params: Promise<{ merchant: string }>;
}) {
  const { merchant } = await params;
  const tenant = await getTenantBySlug(merchant);
  const session = await auth();

  if (!tenant || !db) notFound();

  const categories = await db
    .select()
    .from(schema.categories)
    .where(
      and(
        eq(schema.categories.tenantId, tenant.id),
        eq(schema.categories.isActive, true)
      )
    )
    .orderBy(asc(schema.categories.displayOrder));

  const featuredProducts = await db
    .select()
    .from(schema.products)
    .where(
      and(
        eq(schema.products.tenantId, tenant.id),
        eq(schema.products.isActive, true)
      )
    )
    .orderBy(desc(schema.products.stockLevel))
    .limit(8);

  return (
    <div className="min-h-screen">
      <div className="fixed inset-0 grid-pattern pointer-events-none" />
      <div className="relative">

        <div className="bg-gradient-to-r from-amber-600/20 via-amber-500/10 to-amber-600/20 border-b border-amber-500/10">
          <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
            <p className="text-center text-xs font-medium tracking-wider text-amber-300/80 uppercase">
              Free shipping on orders over $2,500 &bull; Wholesale pricing for verified businesses &bull; Est. 2024
            </p>
          </div>
        </div>

        <section className="mx-auto mt-16 max-w-5xl text-center px-4 sm:px-6 lg:px-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-semibold tracking-wider uppercase text-amber-400">
              United Distribution &mdash; Wholesale Since 2024
            </span>
          </div>
          <h1 className="text-5xl font-black tracking-tight text-gray-50 sm:text-6xl lg:text-7xl">
            Wholesale Tobacco,
            <br />
            <span className="text-gradient">Vape &amp; Glassware</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400 sm:text-xl">
            Premium bulk products for verified smoke shops and convenience stores. 
            Tier-based wholesale pricing with fast fulfillment across the US.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={`/${merchant}/products`}
              className="btn-premium inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-bold"
            >
              Browse Full Catalog
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
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
                Sign In for Wholesale Pricing
              </Link>
            )}
          </div>
        </section>

        <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-black text-gray-100 sm:text-4xl">
              Shop by Category
            </h2>
            <p className="mt-2 text-gray-400">
              Find exactly what you need for your business
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/${merchant}/products?category=${cat.id}`}
                className={`group relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br ${categoryGradients[cat.slug] || "from-gray-600/20 to-gray-800/10"} p-6 transition-all hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5`}
              >
                <div className="text-3xl mb-3 transition-transform group-hover:scale-110">
                  {categoryIcons[cat.slug] || "📋"}
                </div>
                <h3 className="text-sm font-bold text-gray-200 group-hover:text-amber-400 transition-colors">
                  {cat.name}
                </h3>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black text-gray-100 sm:text-4xl">
                Featured Products
              </h2>
              <p className="mt-2 text-gray-400">
                Top-selling wholesale items
              </p>
            </div>
            <Link
              href={`/${merchant}/products`}
              className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors"
            >
              View All
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featuredProducts.map((product) => {
              const isNew = product.stockLevel >= 400;
              return (
                <Link
                  key={product.id}
                  href={`/${merchant}/product/${product.id}`}
                  className="card-premium group relative rounded-xl p-4 transition-all hover:border-amber-500/20"
                >
                  {isNew && (
                    <span className="absolute left-3 top-3 z-10 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-900">
                      Best Seller
                    </span>
                  )}
                  <div className="mb-3 h-48 w-full overflow-hidden rounded-lg bg-gray-900">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-800 text-gray-400">
                        <span className="text-sm font-medium">Image coming soon</span>
                      </div>
                    )}
                  </div>
                  <p className="mb-1 font-mono text-[10px] text-gray-500">
                    {product.sku}
                  </p>
                  <h3 className="mb-2 text-sm font-semibold leading-snug text-gray-100 line-clamp-2 group-hover:text-amber-400 transition-colors">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-black text-amber-400">
                        ${parseFloat(product.basePrice.toString()).toFixed(2)}
                      </span>
                      <span className="ml-1 text-[10px] text-gray-500">/ea</span>
                    </div>
                    {product.stockLevel <= 10 && product.stockLevel > 0 && (
                      <span className="text-[10px] font-medium text-amber-400">
                        Low Stock
                      </span>
                    )}
                    {product.stockLevel === 0 && (
                      <span className="text-[10px] font-medium text-red-400">
                        Out of Stock
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Link
              href={`/${merchant}/products`}
              className="btn-outline inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm"
            >
              View All Products
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
          </div>
        </section>

        <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-600/20 via-amber-500/5 to-purple-600/20 border border-amber-500/10 p-8 sm:p-12 text-center">
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-1.5 text-xs font-semibold tracking-wider uppercase text-amber-400">
                New Category
              </span>
              <h2 className="mt-4 text-3xl font-black text-gray-100 sm:text-4xl">
                Glassware &amp; Accessories
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-gray-400">
                Premium borosilicate glass bongs, spoon pipes, grinders, chillums, 
                and storage solutions. Hand-selected from top brands.
              </p>
              <Link
                href={`/${merchant}/products?category=${categories.find(c => c.slug === 'glassware')?.id || ''}`}
                className="btn-premium mt-8 inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-bold"
              >
                Shop Glassware
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-24 max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-black text-gray-100 sm:text-4xl">
              Why United Distribution?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-gray-400">
              Headquartered in St. Louis, MO &mdash; your trusted wholesale partner
              for the smoke shop and convenience trade.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: "🏢",
                title: "Licensed & Insured",
                desc: "Fully compliant Missouri DBA. Federally registered tobacco licensing.",
              },
              {
                icon: "🚚",
                title: "Fast Fulfillment",
                desc: "Orders processed within 24 hours. Reliable shipping across all 50 states.",
              },
              {
                icon: "💰",
                title: "Tiered Pricing",
                desc: "Volume discounts at 10+, 50+, and 100+ units. Better margins as you grow.",
              },
              {
                icon: "🔐",
                title: "Secure & Compliant",
                desc: "Age verification, license tracking, and audit-ready records built in.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="card-premium rounded-2xl p-6 text-center transition-all hover:border-amber-500/20"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-2xl">
                  {item.icon}
                </div>
                <h3 className="text-sm font-bold text-gray-100">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs text-gray-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-24 max-w-5xl px-4 sm:px-6 lg:px-8 pb-24">
          <div className="rounded-3xl border border-white/5 bg-surface/50 p-8 sm:p-12 text-center">
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
                  className="btn-premium inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-bold"
                >
                  Browse Products
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </Link>
              ) : (
                <Link
                  href={`/${merchant}/auth/signin`}
                  className="btn-premium inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-bold"
                >
                  Sign In to Order
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </Link>
              )}
              <Link
                href={`/${merchant}/wholesale`}
                className="btn-outline inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base"
              >
                Apply for Wholesale
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
