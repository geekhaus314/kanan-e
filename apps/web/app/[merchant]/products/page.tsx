import { db, schema } from "@kananos/database";
import { eq, and, asc } from "drizzle-orm";
import { getTenantBySlug } from "@/lib/tenant";
import { notFound } from "next/navigation";
import Link from "next/link";
import { brandTileFor } from "@/lib/brandTile";
import { AddToCartButton } from "@/components/AddToCartButton";
import { ProductImage } from "@/components/ProductImage";

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ merchant: string }>;
  searchParams: Promise<{ query?: string; category?: string }>;
}) {
  const { merchant } = await params;
  const { query, category } = await searchParams;
  const tenant = await getTenantBySlug(merchant);

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

  // Resolve the ?category= param: accept either a numeric id or a slug.
  let resolvedCategoryId: number | null = null;
  if (category) {
    const asNumber = Number(category);
    if (!Number.isNaN(asNumber)) {
      resolvedCategoryId = asNumber;
    } else {
      const bySlug = categories.find((c) => c.slug === category);
      if (bySlug) resolvedCategoryId = bySlug.id;
    }
  }

  const conditions = [
    eq(schema.products.tenantId, tenant.id),
    eq(schema.products.isActive, true),
  ];

  if (resolvedCategoryId !== null) {
    conditions.push(eq(schema.products.categoryId, resolvedCategoryId));
  }

  const products = await db
    .select()
    .from(schema.products)
    .where(and(...conditions))
    .orderBy(asc(schema.products.name))
    .limit(200);

  return (
    <div className="min-h-screen bg-gradient-surface">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-gray-100 sm:text-4xl">
            Product Catalog
          </h1>
          <p className="mt-2 text-gray-400">
            Browse our full wholesale catalog
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4">
          <Link
            href={`/${merchant}/products`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              !category
                ? "bg-gradient-brand text-gray-900"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            All
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/${merchant}/products?category=${cat.id}`}
              className={`rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                String(cat.id) === category
                  ? "bg-gradient-brand text-gray-900"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 py-8 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="card-premium group flex flex-col rounded-xl p-4 transition-all"
            >
              <Link
                href={`/${merchant}/product/${product.id}`}
                className="block"
              >
                <div className="mb-3 flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-white/5">
                  <ProductImage
                    imageUrl={product.imageUrl}
                    fallbackSrc={brandTileFor(product.sku)}
                    alt={product.name}
                    className="text-4xl"
                  />
                </div>
                <p className="mb-1 font-mono text-xs text-gray-500">
                  {product.sku}
                </p>
                <h3 className="mb-2 text-sm font-semibold leading-snug text-gray-100 line-clamp-2">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black text-gold-400">
                    ${parseFloat(product.basePrice.toString()).toFixed(2)}
                  </span>
                  {product.stockLevel <= 10 && product.stockLevel > 0 && (
                    <span className="text-xs font-medium text-gold-400">
                      Low Stock
                    </span>
                  )}
                  {product.stockLevel === 0 && (
                    <span className="text-xs font-medium text-red-400">
                      Out of Stock
                    </span>
                  )}
                </div>
              </Link>
              <div className="mt-3">
                <AddToCartButton
                  productId={product.id}
                  merchant={merchant}
                  isAgeRestricted={product.isAgeRestricted}
                  stockLevel={product.stockLevel}
                  variant="outline"
                />
              </div>
            </div>
          ))}
        </div>

        {products.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-gray-500">No products found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
