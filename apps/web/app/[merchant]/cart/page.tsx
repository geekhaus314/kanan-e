import { db, schema } from "@kananos/database";
import { eq, and } from "drizzle-orm";
import { getTenantBySlug } from "@/lib/tenant";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
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
  if (!session?.user?.id) redirect(`/${merchant}/auth/signin`);

  const userId = Number(session.user.id);

  const items = await db
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
    );

  const subtotal = items.reduce(
    (sum, item) =>
      sum + parseFloat(item.priceAtAddition) * item.quantity,
    0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900">Cart</h1>
          <p className="mt-1 text-gray-500">
            {items.length} item{items.length !== 1 ? "s" : ""} in your cart
          </p>
        </div>

        {items.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-white p-12 text-center">
            <p className="mb-4 text-gray-400">Your cart is empty.</p>
            <a
              href={`/${merchant}/products`}
              className="inline-block rounded-xl bg-amber-400 px-6 py-3 text-sm font-bold text-gray-900 hover:bg-amber-500"
            >
              Browse Products
            </a>
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
