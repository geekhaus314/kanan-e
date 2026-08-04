import { db, schema } from "@kananos/database";
import { eq, and, desc } from "drizzle-orm";
import { getTenantBySlug } from "@/lib/tenant";
import { auth } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n";
import { notFound, redirect } from "next/navigation";

export default async function EmployeeDashboardPage({
  params,
}: {
  params: Promise<{ merchant: string }>;
}) {
  const { merchant } = await params;
  const tenant = await getTenantBySlug(merchant);
  if (!tenant || !db) notFound();

  const session = await auth();
  if (!session?.user?.id) redirect(`/${merchant}/auth/signin`);

  const tenantUser = await db
    .select()
    .from(schema.tenantUsers)
    .where(
      and(
        eq(schema.tenantUsers.userId, Number(session.user.id)),
        eq(schema.tenantUsers.tenantId, tenant.id)
      )
    )
    .limit(1)
    .then((r) => r[0]);

  if (!tenantUser || (tenantUser.role !== "employee" && tenantUser.role !== "admin")) {
    notFound();
  }

  const { t } = await getTranslations();

  const [orderCount, productCount, recentOrders] = await Promise.all([
    db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.tenantId, tenant.id))
      .then((r) => r.length),
    db
      .select()
      .from(schema.products)
      .where(
        and(
          eq(schema.products.tenantId, tenant.id),
          eq(schema.products.isActive, true)
        )
      )
      .then((r) => r.length),
    db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.tenantId, tenant.id))
      .orderBy(desc(schema.orders.createdAt))
      .limit(5),
  ]);

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-black text-gray-900">
          {t("employee.dashboard")}
        </h1>

        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <div className="card-premium rounded-xl p-6">
            <p className="text-sm text-gray-400">{t("employee.orders")}</p>
            <p className="text-3xl font-black text-gray-900">{orderCount}</p>
          </div>
          <div className="card-premium rounded-xl p-6">
            <p className="text-sm text-gray-400">{t("employee.products")}</p>
            <p className="text-3xl font-black text-gray-900">{productCount}</p>
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-lg font-bold text-gray-900">
            {t("employee.recentOrders")}
          </h2>

          {recentOrders.length === 0 ? (
            <div className="card-premium rounded-xl p-12 text-center">
              <p className="text-gray-400">{t("employee.noOrders")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-gray-50">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left font-medium text-gray-400">{t("employee.orderNumber")}</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-400">{t("employee.date")}</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-400">{t("employee.total")}</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-400">{t("employee.status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-200">
                      <td className="px-4 py-3 font-medium text-gray-900">#{order.id}</td>
                      <td className="px-4 py-3 text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        ${parseFloat(order.totalAmount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-xs font-medium text-brand-600">
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
