import { db, schema } from "@kananos/database";
import { eq, and } from "drizzle-orm";
import { getTenantBySlug } from "@/lib/tenant";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CartContents } from "./client";

export default async function CartPage({
  params,
}: {
  params: Promise<{ merchant: string }>;
}) {
  const { merchant } = await params;
  const tenant = await getTenantBySlug(merchant);
  if (!tenant || !db) notFound();

  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;

  const items = userId
    ? await db
        .select({
          id: schema.cartItems.id,
          productId: schema.cartItems.productId,
          quantity: schema.cartItems.quantity,
          priceAtAddition: schema.cartItems.priceAtAddition,
          productName: schema.products.name,
          sku: schema.products.sku,
          imageUrl: schema.products.imageUrl,
          basePrice: schema.products.basePrice,
          isAgeRestricted: schema.products.isAgeRestricted,
          stockLevel: schema.products.stockLevel,
        })
        .from(schema.cartItems)
        .innerJoin(
          schema.products,
          eq(schema.cartItems.productId, schema.products.id)
        )
        .where(
          and(
            eq(schema.cartItems.userId, userId),
            eq(schema.cartItems.tenantId, tenant.id)
          )
        )
    : [];

  const subtotal = items.reduce(
    (sum, item) =>
      sum + parseFloat(item.priceAtAddition) * item.quantity,
    0
  );

  return (
    <div className="min-h-screen bg-gradient-surface">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900">Shopping Cart</h1>
          <p className="mt-1 text-gray-500">
            {items.length} item{items.length !== 1 ? "s" : ""} in your cart
          </p>
        </div>

        {items.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-12 text-center">
            <p className="mb-4 text-gray-400">
              {session?.user?.id
                ? "Your cart is empty."
                : "Sign in to view your cart and save items."}
            </p>
            <Link
              href={`/${merchant}/products`}
              className="btn-premium inline-block rounded-xl px-6 py-3 text-sm font-bold"
            >
              Browse Products
            </Link>
            {!session?.user?.id && (
              <Link
                href={`/${merchant}/auth/signin`}
                className="btn-outline ml-3 inline-block rounded-xl px-6 py-3 text-sm font-semibold"
              >
                Sign In
              </Link>
            )}
          </div>
        ) : (
          <CartContents
            items={items.map((i) => ({
              ...i,
              lineTotal: parseFloat(i.priceAtAddition) * i.quantity,
            }))}
            subtotal={subtotal}
            merchant={merchant}
          />
        )}
      </div>
    </div>
  );
}
