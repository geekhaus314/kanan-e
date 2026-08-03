import { getTenantBySlug } from "@/lib/tenant";
import { db, schema } from "@kananos/database";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { eq, and, asc, desc, sql } from "drizzle-orm";
import Link from "next/link";
import { CartBadge } from "@/components/CartBadge";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ProductImage } from "@/components/ProductImage";

// Brand tile fallback per SKU prefix (honest, never-broken wordmark tiles)
const BRAND_TILE: Record<string, string> = {
  ZYN: "/brand-assets/brands/zyn.svg",
  MARLB: "/brand-assets/brands/marlboro.svg",
  NWPT: "/brand-assets/brands/newport.svg",
  CAMEL: "/brand-assets/brands/camel.svg",
  RAW: "/brand-assets/brands/raw.svg",
  GEEK: "/brand-assets/brands/geekbar.svg",
  JUICE: "/brand-assets/brands/juicehead.svg",
  ZIPPO: "/brand-assets/brands/zippo.svg",
  BLKMLD: "/brand-assets/brands/blackmild.svg",
  SWISH: "/brand-assets/brands/swisher.svg",
};
function brandTileFor(sku?: string | null) {
  if (!sku) return "/brand-assets/brands/ud.svg";
  const key = Object.keys(BRAND_TILE).find((k) => sku.toUpperCase().startsWith(k));
  return key ? BRAND_TILE[key] : "/brand-assets/brands/ud.svg";
}

export default async function MerchantHome({
  params,
}: {
  params: Promise<{ merchant: string }>;
}) {
  const { merchant } = await params;
  const tenant = await getTenantBySlug(merchant);
  const session = await auth();
  if (!tenant) notFound();

  const productsPromise = db
    ? db
        .select()
        .from(schema.products)
        .where(and(eq(schema.products.tenantId, tenant.id), eq(schema.products.isActive, true)))
        .orderBy(desc(schema.products.stockLevel))
        .limit(8)
    : Promise.resolve([]);

  const categoriesPromise = db
    ? db
        .select({
          id: schema.categories.id,
          name: schema.categories.name,
          slug: schema.categories.slug,
          productCount: sql<number>`count(${schema.products.id})::int`,
        })
        .from(schema.categories)
        .leftJoin(
          schema.products,
          and(
            eq(schema.products.categoryId, schema.categories.id),
            eq(schema.products.isActive, true),
            eq(schema.products.tenantId, tenant.id)
          )
        )
        .where(and(eq(schema.categories.tenantId, tenant.id), eq(schema.categories.isActive, true)))
        .groupBy(schema.categories.id)
        .orderBy(asc(schema.categories.displayOrder))
    : Promise.resolve([]);

  const [featured, categories] = await Promise.all([productsPromise, categoriesPromise]);

  return (
    <main className="min-h-screen bg-gradient-surface">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-24">
        {/* HERO */}
        <section className="mx-auto mt-16 max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-4 py-1.5 text-xs font-semibold tracking-wider uppercase text-amber-400">
            Est. 2024 — United Distribution · Florissant, MO
          </span>
          <h1 className="mt-6 text-5xl font-black tracking-tight text-gray-50 sm:text-6xl lg:text-7xl">
            Wholesale Smoke Shop
            <br />
            <span className="text-gradient">Supply &amp; Accessories</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400 sm:text-xl">
            Real brands. Real volume pricing. For licensed retailers and 21+
            consumers alike — cartons, vapes, pouches, and accessories shipped
            fast.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href={`/${merchant}/products`} className="btn-premium inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base">
              Shop the Catalog →
            </Link>
            {!session?.user && (
              <Link href={`/${merchant}/auth/signin`} className="btn-outline inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base">
                Sign In for Wholesale Pricing
              </Link>
            )}
          </div>
          {!session?.user && (
            <p className="mt-4 text-xs text-gray-500">
              Sign in to unlock B2B tiers. Retail prices shown to everyone.
            </p>
          )}
        </section>

        {/* CATEGORY GRID */}
        {categories.length > 0 && (
          <section className="mx-auto mt-24">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-black text-gray-100 sm:text-3xl">Shop by Category</h2>
                <p className="mt-1 text-sm text-gray-500">{featured.length} products live across {categories.length} categories</p>
              </div>
              <Link href={`/${merchant}/products`} className="hidden text-sm font-medium text-amber-400 hover:text-amber-300 sm:block">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {categories.map((cat) => (
                <Link key={cat.id} href={`/${merchant}/products?category=${cat.id}`} className="card-premium group rounded-2xl p-5 transition-all hover:border-amber-500/30">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">▦</div>
                  <h3 className="text-sm font-semibold text-gray-100">{cat.name}</h3>
                  <p className="mt-1 text-xs text-gray-500">{Number(cat.productCount)} item{Number(cat.productCount) === 1 ? "" : "s"}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* FEATURED PRODUCTS */}
        {featured.length > 0 && (
          <section className="mx-auto mt-24">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-black text-gray-100 sm:text-3xl">Featured Products</h2>
                <p className="mt-1 text-sm text-gray-500">Top-stocked inventory, ready to ship</p>
              </div>
              <Link href={`/${merchant}/products`} className="hidden text-sm font-medium text-amber-400 hover:text-amber-300 sm:block">
                Full catalog →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {featured.map((product) => (
                <Link key={product.id} href={`/${merchant}/product/${product.id}`} className="card-premium group rounded-xl p-4 transition-all hover:border-amber-500/30">
                  <div className="relative mb-3 flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-white/5">
                    <ProductImage imageUrl={product.imageUrl} fallbackSrc={brandTileFor(product.sku)} alt={product.name} className="text-4xl" />
                    {product.isAgeRestricted && (
                      <span className="absolute right-2 top-2 rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white">21+</span>
                    )}
                  </div>
                  <p className="mb-1 font-mono text-xs text-gray-500">{product.sku}</p>
                  <h3 className="mb-2 text-sm font-semibold leading-snug text-gray-100 line-clamp-2">{product.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-black text-amber-400">${parseFloat(product.basePrice.toString()).toFixed(2)}</span>
                    {product.stockLevel <= 10 && product.stockLevel > 0 && <span className="text-xs font-medium text-amber-400">Low Stock</span>}
                    {product.stockLevel === 0 && <span className="text-xs font-medium text-red-400">Out of Stock</span>}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* B2B BAND */}
        <section className="mx-auto mt-24">
          <div className="section-divider w-24 mx-auto mb-12" />
          <div className="card-premium rounded-3xl p-8 sm:p-12 text-center">
            <h2 className="text-3xl font-black text-gray-100 sm:text-4xl">Built for Shops &amp; Gas Stations</h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-400">
              Volume tiers unlock automatically as your cart grows. Sign in with
              your business email to see wholesale pricing and place B2B orders.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              {session?.user ? (
                <Link href={`/${merchant}/products`} className="btn-premium inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base">Browse Wholesale →</Link>
              ) : (
                <Link href={`/${merchant}/auth/signin`} className="btn-premium inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base">Create Wholesale Account</Link>
              )}
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="mt-24 border-t border-white/5 py-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-brand text-sm font-black text-gray-900">UD</div>
            <span className="text-sm font-semibold text-gray-500">United Distribution</span>
          </div>
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} Kanan Enterprises LLC. All rights reserved.
            Licensed tobacco reseller. 21+ verification required for restricted products.
          </p>
        </footer>
      </div>
    </main>
  );
}
