import { db, schema } from "@kananos/database";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getTenantBySlug } from "@/lib/tenant";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function PlatformPage({
  params,
}: {
  params: Promise<{ merchant: string }>;
}) {
  const { merchant } = await params;
  const tenant = await getTenantBySlug(merchant);
  if (!tenant || !db) notFound();

  const database = db;

  const session = await auth();
  const isRoot = (session?.user as Record<string, unknown> | undefined)
    ?.role === "root";
  if (!isRoot) notFound();

  const tenants = await database.select().from(schema.tenants);

  const tenantData = await Promise.all(
    tenants.map(async (t) => {
      const [userCount] = await database
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.tenantUsers)
        .where(eq(schema.tenantUsers.tenantId, t.id));

      const [productCount] = await database
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.products)
        .where(eq(schema.products.tenantId, t.id));

      const [orderCount] = await database
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.orders)
        .where(eq(schema.orders.tenantId, t.id));

      return {
        ...t,
        users: Number(userCount?.count ?? 0),
        products: Number(productCount?.count ?? 0),
        orders: Number(orderCount?.count ?? 0),
      };
    })
  );

  const totalUsers = tenantData.reduce((a, b) => a + b.users, 0);
  const totalProducts = tenantData.reduce((a, b) => a + b.products, 0);
  const totalOrders = tenantData.reduce((a, b) => a + b.orders, 0);

  return (
    <div>
      <div className="mb-2 flex items-center gap-3">
        <span className="rounded-md bg-gray-800 px-2 py-0.5 text-[10px] font-black text-gold-400">
          ROOT
        </span>
        <h1 className="text-3xl font-black text-gray-900">
          Platform Overview
        </h1>
      </div>
      <p className="mb-8 text-sm text-gray-500">
        Signed in as <span className="text-gray-700">{session?.user?.email}</span>
      </p>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-500">Tenants</p>
          <p className="text-3xl font-black text-gray-900">
            {tenants.length}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-3xl font-black text-emerald-600">
            {totalUsers}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-500">Total Products</p>
          <p className="text-3xl font-black text-purple-600">
            {totalProducts}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-3xl font-black text-gold-600">
            {totalOrders}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-4 py-3 text-left font-medium text-gray-500">
                Tenant
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">
                Slug
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">
                Domain
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">
                Users
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">
                Products
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">
                Orders
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {tenantData.map((t) => (
              <tr key={t.id} className="border-b border-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {t.name}
                </td>
                <td className="px-4 py-3 text-gray-500">{t.slug}</td>
                <td className="px-4 py-3 text-gray-500">
                  {t.domain ?? "—"}
                </td>
                <td className="px-4 py-3">{t.users}</td>
                <td className="px-4 py-3">{t.products}</td>
                <td className="px-4 py-3">{t.orders}</td>
                <td className="px-4 py-3">
                  {t.isActive ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                      Active
                    </span>
                  ) : (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                      Inactive
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
