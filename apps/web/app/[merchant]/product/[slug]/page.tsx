import { db, schema } from "@kananos/database";
import { eq, and, asc } from "drizzle-orm";
import { getTenantBySlug } from "@/lib/tenant";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ merchant: string; slug: string }>;
}) {
  const { merchant, slug } = await params;
  const tenant = await getTenantBySlug(merchant);
  const productId = Number(slug);

  if (!tenant || !db || isNaN(productId)) notFound();

  const product = await db
    .select()
    .from(schema.products)
    .where(
      and(
        eq(schema.products.id, productId),
        eq(schema.products.tenantId, tenant.id),
        eq(schema.products.isActive, true)
      )
    )
    .limit(1)
    .then((r) => r[0]);

  if (!product) notFound();

  const bulkPricing = await db
    .select()
    .from(schema.bulkPricingTiers)
    .where(eq(schema.bulkPricingTiers.productId, product.id))
    .orderBy(asc(schema.bulkPricingTiers.minQuantity));

  const basePrice = parseFloat(product.basePrice.toString());

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Link
          href={`/${merchant}/products`}
          className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-amber-600"
        >
          ← Back to Products
        </Link>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="flex aspect-square items-center justify-center rounded-2xl bg-white">
            <span className="text-8xl">
              {product.isAgeRestricted ? "🚬" : "📦"}
            </span>
          </div>

          <div>
            <p className="mb-2 font-mono text-sm text-gray-400">
              {product.sku}
            </p>
            <h1 className="mb-4 text-3xl font-black text-gray-900">
              {product.name}
            </h1>
            {product.description && (
              <p className="mb-6 text-gray-600 leading-relaxed">
                {product.description}
              </p>
            )}

            <div className="mb-6 rounded-xl bg-white p-6">
              <div className="mb-4">
                <span className="text-sm text-gray-500">Base Price</span>
                <div className="text-3xl font-black text-amber-600">
                  ${basePrice.toFixed(2)}
                </div>
              </div>

              {product.wholesalePrice && (
                <div className="mb-4">
                  <span className="text-sm text-gray-500">Wholesale Price</span>
                  <div className="text-xl font-bold text-green-600">
                    ${parseFloat(product.wholesalePrice.toString()).toFixed(2)}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Stock:</span>
                {product.stockLevel > 0 ? (
                  <span className="font-semibold text-green-600">
                    {product.stockLevel} units
                  </span>
                ) : (
                  <span className="font-semibold text-red-500">
                    Out of Stock
                  </span>
                )}
              </div>
            </div>

            {product.isAgeRestricted && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-800">
                  21+ Age Restricted Product
                </p>
                <p className="text-sm text-red-600">
                  Age verification required at checkout.
                </p>
              </div>
            )}

            {bulkPricing.length > 0 && (
              <div className="rounded-xl border border-gray-100 bg-white p-6">
                <h3 className="mb-3 font-bold text-gray-900">
                  Bulk Pricing Tiers
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-medium text-gray-500 pb-2 border-b border-gray-100">
                    <span>Quantity</span>
                    <span>Price Per Unit</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>1 — {bulkPricing[0]!.minQuantity - 1}</span>
                    <span className="font-semibold">
                      ${basePrice.toFixed(2)}
                    </span>
                  </div>
                  {bulkPricing.map((tier) => (
                    <div
                      key={tier.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>
                        {tier.minQuantity}
                        {tier.maxQuantity
                          ? ` — ${tier.maxQuantity}`
                          : "+"}
                      </span>
                      <span className="font-semibold text-amber-600">
                        ${parseFloat(tier.price.toString()).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
