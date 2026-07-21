import { db, schema } from "@kananos/database";
import { eq, and } from "drizzle-orm";
import { getTenantBySlug } from "@/lib/tenant";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { CheckoutForm } from "./client";

export default async function CheckoutPage({
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
      basePrice: schema.products.basePrice,
      isAgeRestricted: schema.products.isAgeRestricted,
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

  if (items.length === 0) redirect(`/${merchant}/cart`);

  const total = items.reduce(
    (sum, i) => sum + parseFloat(i.priceAtAddition) * i.quantity,
    0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900">Checkout</h1>
          <p className="mt-1 text-gray-500">Complete your order</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <CheckoutForm
              merchant={merchant}
              items={items.map((i) => ({
                productId: i.productId,
                productName: i.productName,
                quantity: i.quantity,
                price: parseFloat(i.priceAtAddition),
              }))}
              total={total}
            />
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-xl border border-gray-100 bg-white p-6">
              <h2 className="mb-4 text-lg font-bold text-gray-900">
                Order Summary
              </h2>
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-900">
                        {item.productName}
                      </p>
                      <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                    </div>
                    <span className="ml-4 font-semibold text-gray-900">
                      ${(parseFloat(item.priceAtAddition) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between font-bold text-gray-900">
                  <span>Total</span>
                  <span className="text-lg text-amber-600">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
