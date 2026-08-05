import { getTenantBySlug } from "@/lib/tenant";
import { db, schema } from "@kananos/database";
import { auth } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n";
import { notFound } from "next/navigation";
import { eq, and, asc, desc, sql } from "drizzle-orm";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { ProductImage } from "@/components/ProductImage";

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
  const { t } = await getTranslations();

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
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/5 px-4 py-1.5 text-xs font-semibold tracking-wider uppercase text-brand-600">
            Est. 2024 — {t("home.heroSubtitle")} · Florissant, MO
          </span>
          <h1 className="mt-6 text-5xl font-black tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
            {t("home.heroTitle")}
            <br />
            <span className="text-gradient">{t("home.heroSubtitle")}</span>
          </h1>
          <p className="mx-auto mt-3 text-sm font-semibold tracking-widest uppercase text-brand-600">
            The Sultans of B2B
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-500 sm:text-xl">
            {t("home.heroDescription")}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href={`/${merchant}/products`} className="btn-premium inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base">
              {t("home.browseCatalog")}
            </Link>
            {!session?.user && (
              <Link href={`/${merchant}/auth/signin`} className="btn-outline inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base">
                {t("home.signIn")}
              </Link>
            )}
          </div>
        </section>

        {/* CATEGORY GRID */}
        {categories.length > 0 && (
          <section className="mx-auto mt-24">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-black text-gray-900 sm:text-3xl">{t("common.products")}</h2>
                <p className="mt-1 text-sm text-gray-400">{featured.length} {t("common.products").toLowerCase()}</p>
              </div>
              <Link href={`/${merchant}/products`} className="hidden text-sm font-medium text-brand-600 hover:text-brand-500 sm:block">
                {t("common.viewAll")} →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {categories.map((cat) => (
                <Link key={cat.id} href={`/${merchant}/products?category=${cat.id}`} className="card-premium group rounded-2xl p-5 transition-all">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600">▦</div>
                  <h3 className="text-sm font-semibold text-gray-900">{cat.name}</h3>
                  <p className="mt-1 text-xs text-gray-400">{Number(cat.productCount)} items</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* BRAND SHOWCASE */}
        <section className="mx-auto mt-20">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-black text-gray-900 sm:text-3xl">Brands We Carry</h2>
            <p className="mt-1 text-sm text-gray-500">Authorized retailer of premium tobacco, vape, and accessory brands</p>
          </div>

          {/* Geek Bar featured promo banner */}
          <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-900 mb-6">
            <img
              src="https://oss.geekbar.com/uploads/upload/upload/202503142027091350_1100X550.jpg"
              alt="Geek Bar - Geek Out Your Taste"
              className="w-full h-auto object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 p-6">
              <p className="text-white/90 text-sm font-medium">Authorized Geek Bar Retailer</p>
              <p className="text-white/70 text-xs mt-1">GEEK OUT YOUR TASTE — Geek Bar Meloso Max 9000 puffs now available</p>
            </div>
          </div>

          {/* Brand tiles grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { name: "Geek Bar", url: "https://oss.geekbar.com/products/meloso-max/flavor2.jpg" },
              { name: "ZYN", url: "https://cdn11.bigcommerce.com/s-pnqv5mwgae/images/stencil/1280x1280/products/27750/169525/1__46505.1781730464.png" },
              { name: "Puffco", url: "https://www.puffco.com/cdn/shop/files/3dxl_0001_Layer-Comp-2_ff517383-7c0f-449c-928c-b59d0c8e007d.png" },
              { name: "Yocan", url: "https://www.yocanvaporizer.com/cdn/shop/products/AllColors_0cc7fcb7-d996-495e-bbc6-f97ab8f4734f.jpg" },
              { name: "Santa Cruz Shredder", url: "https://santacruzshredder.com/cdn/shop/files/Alum-small-4pc-glossygrey-SM4GY1_2048x.jpg" },
              { name: "Zippo", url: "https://zippo.com/cdn/shop/products/iz4bom1aldk8cuunvi5y.jpg" },
            ].map((brand) => (
              <Link
                key={brand.name}
                href={`/${merchant}/products?q=${encodeURIComponent(brand.name)}`}
                className="card-premium group flex flex-col items-center justify-center rounded-xl p-5 transition-all"
              >
                <div className="mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-gray-50">
                  <img
                    src={brand.url}
                    alt={brand.name}
                    className="max-h-16 max-w-16 object-contain"
                    loading="lazy"
                  />
                </div>
                <span className="text-xs font-semibold text-gray-700 group-hover:text-brand-600 transition-colors">
                  {brand.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* FEATURED PRODUCTS */}
        {featured.length > 0 && (
          <section className="mx-auto mt-24">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-black text-gray-900 sm:text-3xl">{t("home.heroTitle")}</h2>
                <p className="mt-1 text-sm text-gray-400">Top-stocked inventory, ready to ship</p>
              </div>
              <Link href={`/${merchant}/products`} className="hidden text-sm font-medium text-brand-600 hover:text-brand-500 sm:block">
                {t("common.viewAll")} →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {featured.map((product) => (
                <Link key={product.id} href={`/${merchant}/product/${product.id}`} className="card-premium group rounded-xl p-4 transition-all">
                  <div className="relative mb-3 flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-gray-50">
                    <ProductImage imageUrl={product.imageUrl} fallbackSrc={brandTileFor(product.sku)} alt={product.name} className="text-4xl" />
                    {product.isAgeRestricted && (
                      <span className="absolute right-2 top-2 rounded-md bg-red-500 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white">21+</span>
                    )}
                  </div>
                  <p className="mb-1 font-mono text-xs text-gray-400">{product.sku}</p>
                  <h3 className="mb-2 text-sm font-semibold leading-snug text-gray-900 line-clamp-2">{product.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-black text-brand-600">${parseFloat(product.basePrice.toString()).toFixed(2)}</span>
                    {product.stockLevel <= 10 && product.stockLevel > 0 && <span className="text-xs font-medium text-amber-500">Low Stock</span>}
                    {product.stockLevel === 0 && <span className="text-xs font-medium text-red-500">Out of Stock</span>}
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
            <h2 className="text-3xl font-black text-gray-900 sm:text-4xl">{t("home.heroCTATitle")}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-500">
              {t("home.heroCTASubtitle")}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              {session?.user ? (
                <Link href={`/${merchant}/products`} className="btn-premium inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base">{t("common.browseProducts")} →</Link>
              ) : (
                <Link href={`/${merchant}/auth/signin`} className="btn-premium inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base">{t("common.signUp")}</Link>
              )}
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="mt-24 border-t border-gray-200 py-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BrandLogo className="h-6 w-auto" />
            <span className="text-sm font-semibold text-gray-400">{t("home.heroSubtitle")}</span>
          </div>
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Kanan Enterprises LLC. All rights reserved.
            Licensed tobacco reseller. 21+ verification required for restricted products.
          </p>
        </footer>
      </div>
    </main>
  );
}
