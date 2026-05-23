/**
 * ProductDetail.tsx — Security-hardened product detail page
 *
 * Security improvements:
 * - productId validated as positive integer before any API call
 * - Quantity bounded server-side (router.ts enforces min(1))
 * - Image src from trusted DB only — no user-controlled URLs rendered
 * - No eval, no dangerouslySetInnerHTML
 *
 * UX improvements:
 * - Image gallery with keyboard navigation
 * - Live bulk price calculation shown in table + inline
 * - Breadcrumb navigation
 * - Accessible quantity stepper (not just raw input)
 * - Quote request CTA
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ShoppingCart,
  ChevronLeft,
  Plus,
  Minus,
  Package,
  Shield,
  Truck,
  BarChart3,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Tag,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

// ─── Constants ─────────────────────────────────────────────────────────────────
const MAX_QTY = 9_999;
const MIN_QTY = 1;

// ─── Safe positive-integer parser ─────────────────────────────────────────────
function parsePositiveInt(value: string | undefined | null): number | null {
  if (!value) return null;
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded-lg ${className}`} aria-hidden />;
}

function ProductDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <Skeleton className="h-96 w-full rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      </div>
    </div>
  );
}

// ─── Quantity stepper ─────────────────────────────────────────────────────────
function QuantityStepper({
  value,
  onChange,
  max,
  disabled,
}: {
  value: number;
  onChange: (n: number) => void;
  max: number;
  disabled?: boolean;
}) {
  const clamp = (n: number) => Math.max(MIN_QTY, Math.min(max, Math.round(n)));

  return (
    <div className="flex items-center gap-0 border border-gray-200 rounded-lg overflow-hidden w-fit" role="group" aria-label="Quantity">
      <button
        onClick={() => onChange(clamp(value - 1))}
        disabled={disabled || value <= MIN_QTY}
        className="px-3 py-2.5 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border-r border-gray-200"
        aria-label="Decrease quantity"
      >
        <Minus className="w-4 h-4" aria-hidden />
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (Number.isFinite(n)) onChange(clamp(n));
        }}
        className="w-16 text-center py-2.5 text-sm font-semibold border-none focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-400 bg-white"
        min={MIN_QTY}
        max={max}
        disabled={disabled}
        aria-label="Quantity"
      />
      <button
        onClick={() => onChange(clamp(value + 1))}
        disabled={disabled || value >= max}
        className="px-3 py-2.5 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border-l border-gray-200"
        aria-label="Increase quantity"
      >
        <Plus className="w-4 h-4" aria-hidden />
      </button>
    </div>
  );
}

// ─── Bulk pricing table ────────────────────────────────────────────────────────
function BulkPricingTable({
  tiers,
  currentQty,
  basePrice,
}: {
  tiers: any[];
  currentQty: number;
  basePrice: number;
}) {
  if (!tiers.length) return null;

  return (
    <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Tag className="w-4 h-4 text-amber-600" aria-hidden />
        <h3 className="font-bold text-gray-900 text-sm">Bulk Pricing Tiers</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label="Bulk pricing tiers">
          <thead>
            <tr className="text-left">
              <th className="text-xs font-semibold text-gray-500 uppercase pb-2">Quantity</th>
              <th className="text-xs font-semibold text-gray-500 uppercase pb-2 text-right">Unit Price</th>
              <th className="text-xs font-semibold text-gray-500 uppercase pb-2 text-right">Savings</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-100">
            {tiers.map((tier, i) => {
              const tierPrice = parseFloat(tier.price.toString());
              const savings = ((basePrice - tierPrice) / basePrice) * 100;
              const isActive =
                currentQty >= tier.minQuantity &&
                (tier.maxQuantity == null || currentQty <= tier.maxQuantity);

              return (
                <tr
                  key={i}
                  className={`${isActive ? "bg-amber-100 rounded" : ""}`}
                  aria-current={isActive ? "true" : undefined}
                >
                  <td className="py-2 pr-4 font-medium text-gray-900">
                    {tier.minQuantity}–{tier.maxQuantity ?? "∞"} units
                    {isActive && (
                      <Badge className="ml-2 bg-amber-600 text-white border-0 text-[10px] px-1.5">Active</Badge>
                    )}
                  </td>
                  <td className="py-2 text-right font-bold text-amber-700">
                    ${tierPrice.toFixed(2)}
                  </td>
                  <td className="py-2 text-right text-green-600 font-semibold text-xs">
                    {savings > 0 ? `-${savings.toFixed(0)}%` : "Base"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Image gallery ─────────────────────────────────────────────────────────────
function ImageGallery({ imageUrl, imageUrls, name }: { imageUrl?: string; imageUrls?: string[]; name: string }) {
  const images = useMemo(() => {
    const all: string[] = [];
    if (imageUrl) all.push(imageUrl);
    if (Array.isArray(imageUrls)) all.push(...imageUrls.filter((u) => u !== imageUrl));
    return all;
  }, [imageUrl, imageUrls]);

  const [active, setActive] = useState(0);

  useEffect(() => { setActive(0); }, [images]);

  if (images.length === 0) {
    return (
      <div className="w-full aspect-square max-h-[500px] bg-gray-100 rounded-2xl flex items-center justify-center">
        <Package className="w-20 h-20 text-gray-200" aria-hidden />
      </div>
    );
  }

  return (
    <div>
      {/* Main image */}
      <div className="relative w-full aspect-square max-h-[500px] bg-gray-50 rounded-2xl overflow-hidden mb-3">
        <img
          src={images[active]}
          alt={`${name} — image ${active + 1} of ${images.length}`}
          className="w-full h-full object-contain"
          loading="eager"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 flex-wrap" role="list" aria-label="Product images">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              role="listitem"
              aria-label={`View image ${i + 1}`}
              aria-pressed={active === i}
              className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                active === i ? "border-amber-400 shadow-md" : "border-gray-100 hover:border-gray-300"
              }`}
            >
              <img src={src} alt="" aria-hidden className="w-full h-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ProductDetail() {
  const [, params] = useRoute("/product/:id");
  // ⚠️ Security: validate ID as positive integer — reject anything that isn't
  const productId = parsePositiveInt(params?.id);
  const { isAuthenticated } = useAuth();
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading: productLoading, isError } = trpc.products.getById.useQuery(
    { id: productId! },
    { enabled: productId !== null }
  );

  const { data: bulkPricing } = trpc.products.getBulkPricing.useQuery(
    { productId: productId! },
    { enabled: productId !== null }
  );

  const { data: bulkPrice } = trpc.products.calculateBulkPrice.useQuery(
    { productId: productId!, quantity },
    { enabled: productId !== null && quantity >= MIN_QTY }
  );

  const addToCartMutation = trpc.cart.addItem.useMutation();

  const basePrice = product ? parseFloat(product.basePrice.toString()) : 0;
  const currentUnitPrice = bulkPrice?.price ?? basePrice;
  const totalPrice = currentUnitPrice * quantity;
  const savingsPerUnit = basePrice - currentUnitPrice;
  const totalSavings = savingsPerUnit * quantity;

  const handleAddToCart = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to add items to your cart");
      return;
    }
    if (!productId || !product) return;

    try {
      await addToCartMutation.mutateAsync({ productId, quantity });
      toast.success(`${quantity} × ${product.name} added to cart`);
    } catch {
      toast.error("Failed to add to cart. Please try again.");
    }
  }, [isAuthenticated, productId, product, quantity, addToCartMutation]);

  // ─── Guard: invalid ID ────────────────────────────────────────────────────
  if (productId === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" aria-hidden />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Product</h1>
          <p className="text-gray-500 mb-6">This product URL is not valid.</p>
          <Link href="/browse">
            <Button>Back to Catalog</Button>
          </Link>
        </div>
      </div>
    );
  }

  // ─── Loading state ────────────────────────────────────────────────────────
  if (productLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-4">
          <Skeleton className="h-5 w-48" />
        </div>
        <ProductDetailSkeleton />
      </div>
    );
  }

  // ─── Error / not found ────────────────────────────────────────────────────
  if (isError || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" aria-hidden />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Product Not Found</h1>
          <p className="text-gray-500 mb-6">This product may have been removed or is no longer active.</p>
          <Link href="/browse">
            <Button>Back to Catalog</Button>
          </Link>
        </div>
      </div>
    );
  }

  const inStock = product.stockLevel > 0;
  const maxQty = Math.min(product.stockLevel || MAX_QTY, MAX_QTY);

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <nav className="bg-gray-50 border-b border-gray-100 py-3" aria-label="Breadcrumb">
        <div className="container mx-auto px-4">
          <ol className="flex items-center gap-1.5 text-sm text-gray-500" role="list">
            <li><Link href="/" className="hover:text-amber-600 transition-colors">Home</Link></li>
            <li aria-hidden><ChevronRight className="w-3.5 h-3.5" /></li>
            <li><Link href="/browse" className="hover:text-amber-600 transition-colors">Catalog</Link></li>
            <li aria-hidden><ChevronRight className="w-3.5 h-3.5" /></li>
            <li className="text-gray-900 font-medium truncate max-w-[200px]" aria-current="page">
              {product.name}
            </li>
          </ol>
        </div>
      </nav>

      {/* Main content */}
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-16">

          {/* Left: image */}
          <div className="lg:sticky lg:top-24 self-start">
            <ImageGallery
              imageUrl={product.imageUrl ?? undefined}
              imageUrls={(product as any).imageUrls ?? undefined}
              name={product.name}
            />
          </div>

          {/* Right: info + purchase */}
          <div>
            {/* SKU + badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="font-mono text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                {product.sku}
              </span>
              {product.isAgeRestricted && (
                <Badge className="bg-red-600 text-white border-0 text-xs font-bold">
                  <AlertTriangle className="w-3 h-3 mr-1" aria-hidden />
                  21+ Verification Required
                </Badge>
              )}
              {product.isActive === false && (
                <Badge variant="secondary" className="text-xs">Inactive</Badge>
              )}
            </div>

            <h1 className="text-3xl font-black text-gray-900 mb-4 leading-tight">
              {product.name}
            </h1>

            {product.description && (
              <p className="text-gray-600 leading-relaxed mb-6">{product.description}</p>
            )}

            {/* Price display */}
            <div className="bg-gray-50 rounded-2xl p-5 mb-5">
              <div className="flex items-end gap-3 mb-1">
                <span className="text-4xl font-black text-amber-600">
                  ${currentUnitPrice.toFixed(2)}
                </span>
                <span className="text-gray-400 text-sm mb-1.5">/ unit</span>
                {savingsPerUnit > 0 && (
                  <span className="text-sm text-green-600 font-semibold mb-1.5">
                    Save ${savingsPerUnit.toFixed(2)}/unit
                  </span>
                )}
              </div>
              {basePrice !== currentUnitPrice && (
                <p className="text-sm text-gray-400 line-through">${basePrice.toFixed(2)} list price</p>
              )}
              <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  Order total ({quantity} unit{quantity !== 1 ? "s" : ""})
                </span>
                <span className="text-lg font-bold text-gray-900">${totalPrice.toFixed(2)}</span>
              </div>
              {totalSavings > 0 && (
                <div className="mt-1 flex justify-between items-center">
                  <span className="text-sm text-green-600 font-medium">Total savings</span>
                  <span className="text-sm text-green-600 font-bold">-${totalSavings.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Bulk pricing tiers */}
            {bulkPricing && bulkPricing.length > 0 && (
              <div className="mb-5">
                <BulkPricingTable tiers={bulkPricing} currentQty={quantity} basePrice={basePrice} />
              </div>
            )}

            {/* Stock */}
            <div className="flex items-center gap-2 mb-5">
              {inStock ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-500" aria-hidden />
                  <span className="text-sm text-green-700 font-medium">
                    In Stock — {product.stockLevel} units available
                  </span>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 text-gray-400" aria-hidden />
                  <span className="text-sm text-red-600 font-medium">Out of Stock</span>
                </>
              )}
            </div>

            {/* Quantity + CTA */}
            <div className="space-y-3 mb-8">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Quantity
              </label>
              <QuantityStepper
                value={quantity}
                onChange={setQuantity}
                max={maxQty}
                disabled={!inStock}
              />

              <Button
                onClick={handleAddToCart}
                disabled={!inStock || addToCartMutation.isPending}
                size="lg"
                className="w-full bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold shadow-lg shadow-amber-400/20 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                aria-disabled={!inStock || addToCartMutation.isPending}
              >
                {addToCartMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" aria-label="Adding to cart" />
                ) : (
                  <ShoppingCart className="w-4 h-4 mr-2" aria-hidden />
                )}
                {inStock ? `Add ${quantity} to Cart — $${totalPrice.toFixed(2)}` : "Out of Stock"}
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="w-full border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-all"
              >
                Request Bulk Quote
              </Button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-gray-100">
              {[
                { icon: Shield, label: "Verified Product" },
                { icon: Truck, label: "Fast Fulfillment" },
                { icon: BarChart3, label: "Track Your Order" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="text-center p-3 bg-gray-50 rounded-xl">
                  <Icon className="w-5 h-5 text-amber-500 mx-auto mb-1.5" aria-hidden />
                  <p className="text-xs text-gray-600 font-medium">{label}</p>
                </div>
              ))}
            </div>

            {/* Product meta */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <h2 className="font-bold text-gray-900 mb-4">Product Details</h2>
              <dl className="space-y-2 text-sm">
                {[
                  { term: "SKU", def: product.sku },
                  { term: "Stock Level", def: `${product.stockLevel} units` },
                  { term: "Base Price", def: `$${basePrice.toFixed(2)} / unit` },
                  ...(product.restrictedProductType && product.restrictedProductType !== "none"
                    ? [{ term: "Product Type", def: product.restrictedProductType.replace(/_/g, " ") }]
                    : []),
                ].map(({ term, def }) => (
                  <div key={term} className="flex justify-between py-2 border-b border-gray-50">
                    <dt className="text-gray-500">{term}</dt>
                    <dd className="font-medium text-gray-900 font-mono text-right">{def}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
