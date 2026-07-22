import { db, schema } from "@kananos/database";
import { eq, and, desc } from "drizzle-orm";
import { getTenantBySlug } from "@/lib/tenant";
import { auth } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n";
import { notFound, redirect } from "next/navigation";
import { MarkShippedButton } from "./client";

export default async function EmployeeOrdersPage({
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

  const orders = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.tenantId, tenant.id))
    .orderBy(desc(schema.orders.createdAt))
    .limit(100);

  return (
    <div>
      <h1 className="mb-8 text-3xl font-black text-gray-900">
        {t("employee.orders")}
      </h1>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white p-12 text-center">
          <p className="text-gray-400">{t("employee.noOrders")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 font-medium text-gray-500">{t("employee.orderNumber")}</th>
                <th className="px-4 py-3 font-medium text-gray-500">{t("employee.date")}</th>
                <th className="px-4 py-3 font-medium text-gray-500">{t("employee.total")}</th>
                <th className="px-4 py-3 font-medium text-gray-500">{t("employee.status")}</th>
                <th className="px-4 py-3 font-medium text-gray-500">{t("employee.customer")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const addr = order.shippingAddress as { name?: string } | null;
                return (
                  <tr key={order.id} className="border-b border-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">#{order.id}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      ${parseFloat(order.totalAmount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        order.status === "shipped" ? "bg-blue-100 text-blue-800" :
                        order.status === "delivered" ? "bg-green-100 text-green-800" :
                        "bg-amber-100 text-amber-800"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {addr?.name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {order.status === "pending_payment" || order.status === "paid" ? (
                        <MarkShippedButton
                          orderId={order.id}
                          merchant={merchant}
                        />
                      ) : order.status === "shipped" ? (
                        <MarkShippedButton
                          orderId={order.id}
                          merchant={merchant}
                          delivered
                        />
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
