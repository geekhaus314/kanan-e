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
    <div className="min-h-screen bg-gradient-surface">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-black text-gray-100">
          {t("employee.dashboard")}
        </h1>

        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <div className="card-premium rounded-xl p-6">
            <p className="text-sm text-gray-500">{t("employee.orders")}</p>
            <p className="text-3xl font-black text-gray-100">{orderCount}</p>
          </div>
          <div className="card-premium rounded-xl p-6">
            <p className="text-sm text-gray-500">{t("employee.products")}</p>
            <p className="text-3xl font-black text-gray-100">{productCount}</p>
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-lg font-bold text-gray-100">
            {t("employee.recentOrders")}
          </h2>

          {recentOrders.length === 0 ? (
            <div className="card-premium rounded-xl p-12 text-center">
              <p className="text-gray-500">{t("employee.noOrders")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-3 text-left font-medium text-gray-500">{t("employee.orderNumber")}</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">{t("employee.date")}</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">{t("employee.total")}</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">{t("employee.status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-white/5">
                      <td className="px-4 py-3 font-medium text-gray-100">#{order.id}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-100">
                        ${parseFloat(order.totalAmount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-300">
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
