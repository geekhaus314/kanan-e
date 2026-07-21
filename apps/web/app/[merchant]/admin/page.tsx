import { db, schema } from "@kananos/database";
import { eq, and, desc } from "drizzle-orm";
import { getTenantBySlug } from "@/lib/tenant";
import { auth } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ merchant: string }>;
}) {
  const { merchant } = await params;
  const tenant = await getTenantBySlug(merchant);
  if (!tenant || !db) notFound();

  const session = await auth();
  if (!session?.user?.id) redirect(`/${merchant}/auth/signin`);

  const adminUser = await db
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

  if (!adminUser || adminUser.role !== "admin") notFound();

  const { t } = await getTranslations();

  const [pendingVerifications, recentOrders, productCount] = await Promise.all([
    db
      .select()
      .from(schema.ageVerifications)
      .where(eq(schema.ageVerifications.verificationStatus, "pending"))
      .then((r) => r.length),
    db
      .select()
      .from(schema.orders)
      .where(
        and(
          eq(schema.orders.tenantId, tenant.id),
          eq(schema.orders.status, "pending_payment")
        )
      )
      .orderBy(desc(schema.orders.createdAt))
      .limit(10),
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
  ]);

  return (
    <div>
      <h1 className="mb-8 text-3xl font-black text-gray-900">{t("admin.dashboard")}</h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-6">
          <p className="text-sm text-gray-500">{t("admin.products")}</p>
          <p className="text-3xl font-black text-gray-900">{productCount}</p>
        </div>
        <Link
          href={`/${merchant}/admin/age-verifications`}
          className="rounded-xl border border-gray-100 bg-white p-6 transition-colors hover:border-amber-200"
        >
          <p className="text-sm text-gray-500">{t("admin.pendingVerifications")}</p>
          <p className="text-3xl font-black text-amber-600">
            {pendingVerifications}
          </p>
        </Link>
        <div className="rounded-xl border border-gray-100 bg-white p-6">
          <p className="text-sm text-gray-500">{t("admin.pendingOrders")}</p>
          <p className="text-3xl font-black text-gray-900">
            {recentOrders.length}
          </p>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-bold text-gray-900">
          {t("admin.recentOrders")}
        </h2>
        {recentOrders.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-white p-12 text-center">
            <p className="text-gray-400">{t("admin.noOrders")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-3 font-medium text-gray-500">{t("admin.orderNumber")}</th>
                  <th className="px-4 py-3 font-medium text-gray-500">{t("admin.date")}</th>
                  <th className="px-4 py-3 font-medium text-gray-500">{t("admin.total")}</th>
                  <th className="px-4 py-3 font-medium text-gray-500">{t("admin.status")}</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      #{order.id}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      ${parseFloat(order.totalAmount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
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
  );
}
