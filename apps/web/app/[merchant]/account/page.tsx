import { db, schema } from "@kananos/database";
import { eq, and, desc } from "drizzle-orm";
import { getTenantBySlug } from "@/lib/tenant";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

export default async function AccountPage({
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

  const tenantUser = await db
    .select()
    .from(schema.tenantUsers)
    .where(
      and(
        eq(schema.tenantUsers.userId, userId),
        eq(schema.tenantUsers.tenantId, tenant.id)
      )
    )
    .limit(1)
    .then((r) => r[0]);

  const user = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1)
    .then((r) => r[0]);

  const orders = await db
    .select()
    .from(schema.orders)
    .where(
      and(
        eq(schema.orders.userId, userId),
        eq(schema.orders.tenantId, tenant.id)
      )
    )
    .orderBy(desc(schema.orders.createdAt))
    .limit(50);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900">My Account</h1>
          <p className="mt-1 text-gray-500">{user?.email}</p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <p className="text-xs text-gray-500">Orders</p>
            <p className="text-2xl font-black text-gray-900">
              {orders.length}
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <p className="text-xs text-gray-500">Account Type</p>
            <p className="text-lg font-black text-gray-900">
              {tenantUser?.isWholesale ? "Wholesale" : "Retail"}
            </p>
          </div>
          <Link
            href={`/${merchant}/wholesale`}
            className="rounded-xl border border-gray-100 bg-white p-4 transition-colors hover:border-amber-200"
          >
            <p className="text-xs text-gray-500">Wholesale</p>
            <p className="text-lg font-black text-amber-600">
              {tenantUser?.isWholesale
                ? "View Account"
                : "Apply Now →"}
            </p>
          </Link>
        </div>

        <div>
          <h2 className="mb-4 text-lg font-bold text-gray-900">
            Order History
          </h2>
          {orders.length === 0 ? (
            <div className="rounded-xl border border-gray-100 bg-white p-12 text-center">
              <p className="mb-4 text-gray-400">No orders yet.</p>
              <Link
                href={`/${merchant}/products`}
                className="inline-block rounded-xl bg-amber-400 px-6 py-3 text-sm font-bold text-gray-900 hover:bg-amber-500"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/${merchant}/account/orders/${order.id}`}
                  className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 transition-colors hover:border-amber-200"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      Order #{order.id}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-amber-600">
                      ${parseFloat(order.totalAmount).toFixed(2)}
                    </p>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      {order.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
