import { db, schema } from "@kananos/database";
import { eq, and } from "drizzle-orm";
import { getTenantBySlug } from "@/lib/tenant";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ merchant: string; orderId: string }>;
}) {
  const { merchant, orderId } = await params;
  const tenant = await getTenantBySlug(merchant);
  if (!tenant || !db) notFound();

  const session = await auth();
  if (!session?.user?.id) redirect(`/${merchant}/auth/signin`);

  const userId = Number(session.user.id);

  const order = await db
    .select()
    .from(schema.orders)
    .where(
      and(
        eq(schema.orders.id, Number(orderId)),
        eq(schema.orders.userId, userId)
      )
    )
    .limit(1)
    .then((r) => r[0]);

  if (!order) notFound();

  const items = await db
    .select({
      id: schema.orderItems.id,
      productId: schema.orderItems.productId,
      quantity: schema.orderItems.quantity,
      pricePerUnit: schema.orderItems.pricePerUnit,
      lineTotal: schema.orderItems.lineTotal,
      productName: schema.products.name,
      sku: schema.products.sku,
    })
    .from(schema.orderItems)
    .innerJoin(
      schema.products,
      eq(schema.orderItems.productId, schema.products.id)
    )
    .where(eq(schema.orderItems.orderId, order.id));

  const addr = order.shippingAddress as {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
  } | null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link
          href={`/${merchant}/account`}
          className="mb-6 inline-flex text-sm text-gray-500 hover:text-gray-900"
        >
          ← Back to Orders
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900">
            Order #{order.id}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Placed {new Date(order.createdAt).toLocaleString()}
          </p>
          <span className="mt-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
            {order.status}
          </span>
        </div>

        <div className="mb-8 rounded-xl border border-gray-100 bg-white p-6">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Items</h2>
          <div className="divide-y divide-gray-100">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {item.productName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {item.sku} × {item.quantity}
                  </p>
                </div>
                <p className="font-semibold text-gray-900">
                  ${parseFloat(item.lineTotal).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-gray-100 pt-4 text-right">
            <span className="text-lg font-black text-amber-600">
              Total: ${parseFloat(order.totalAmount).toFixed(2)}
            </span>
          </div>
        </div>

        {addr && (
          <div className="rounded-xl border border-gray-100 bg-white p-6">
            <h2 className="mb-4 text-lg font-bold text-gray-900">
              Shipping Address
            </h2>
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-900">{addr.name}</p>
              {addr.email && <p>{addr.email}</p>}
              {addr.phone && <p>{addr.phone}</p>}
              <p className="mt-2">{addr.address}</p>
              <p>
                {addr.city}, {addr.state} {addr.zip}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
