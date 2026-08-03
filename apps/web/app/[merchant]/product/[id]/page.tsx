import { db, schema } from "@kananos/database";
import { eq, and, asc } from "drizzle-orm";
import { getTenantBySlug } from "@/lib/tenant";
import { notFound } from "next/navigation";
import Link from "next/link";
import { brandTileFor } from "@/lib/brandTile";
import { AddToCartButton } from "@/components/AddToCartButton";
import { ProductImage } from "@/components/ProductImage";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ merchant: string; id: string }>;
}) {
  const { merchant, id } = await params;
  const tenant = await getTenantBySlug(merchant);
  const productId = Number(id);

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
    <div className="min-h-screen bg-gradient-surface">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href={`/${merchant}/products`}
          className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition-colors hover:text-gold-400"
        >
          ← Back to Products
        </Link>

        <div className="grid gap-12 lg:grid-cols-2">
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-white/5">
            <ProductImage
              imageUrl={product.imageUrl}
              fallbackSrc={brandTileFor(product.sku)}
              alt={product.name}
              className="text-8xl"
            />
          </div>

          <div>
            <p className="mb-2 font-mono text-sm text-gray-500">
              {product.sku}
            </p>
            <h1 className="mb-4 text-3xl font-black text-gray-100 sm:text-4xl">
              {product.name}
            </h1>
            {product.description && (
              <p className="mb-6 text-gray-400 leading-relaxed">
                {product.description}
              </p>
            )}

            <div className="mb-6 rounded-xl bg-white/[0.03] border border-white/10 p-6">
              <div className="mb-4">
                <span className="text-sm text-gray-500">Base Price</span>
                <div className="text-3xl font-black text-gold-400">
                  ${basePrice.toFixed(2)}
                </div>
              </div>

              {product.wholesalePrice && (
                <div className="mb-4">
                  <span className="text-sm text-gray-500">Wholesale Price</span>
                  <div className="text-xl font-bold text-green-400">
                    ${parseFloat(product.wholesalePrice.toString()).toFixed(2)}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Stock:</span>
                {product.stockLevel > 0 ? (
                  <span className="font-semibold text-green-400">
                    {product.stockLevel} units
                  </span>
                ) : (
                  <span className="font-semibold text-red-400">
                    Out of Stock
                  </span>
                )}
              </div>
            </div>

            {product.isAgeRestricted && (
              <div className="mb-6 rounded-xl border border-gold-500/20 bg-gold-500/5 p-4">
                <p className="text-sm font-semibold text-gold-300">
                  21+ Age Restricted Product
                </p>
                <p className="text-sm text-gray-500">
                  Age verification required at checkout.
                </p>
              </div>
            )}

            {bulkPricing.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
                <h3 className="mb-3 font-bold text-gray-100">
                  Bulk Pricing Tiers
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-medium text-gray-500 pb-2 border-b border-white/5">
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
                      <span className="font-semibold text-gold-400">
                        ${parseFloat(tier.price.toString()).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2">
              <AddToCartButton
                productId={product.id}
                merchant={merchant}
                isAgeRestricted={product.isAgeRestricted}
                stockLevel={product.stockLevel}
              />
              <p className="mt-2 text-center text-xs text-gray-600">
                Sign in to add items to your wholesale cart.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
