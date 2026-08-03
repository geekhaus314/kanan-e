import { db, schema } from "@kananos/database";
import { eq, and, asc } from "drizzle-orm";
import { getTenantBySlug } from "@/lib/tenant";
import { auth } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n";
import { notFound, redirect } from "next/navigation";

export default async function EmployeeProductsPage({
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

  const products = await db
    .select()
    .from(schema.products)
    .where(
      and(
        eq(schema.products.tenantId, tenant.id),
        eq(schema.products.isActive, true)
      )
    )
    .orderBy(asc(schema.products.name));

  return (
    <div>
      <h1 className="mb-8 text-3xl font-black text-gray-900">
        {t("employee.productCatalog")}
      </h1>

      {products.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white p-12 text-center">
          <p className="text-gray-400">{t("employee.noProducts")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 font-medium text-gray-500">{t("employee.sku")}</th>
                <th className="px-4 py-3 font-medium text-gray-500">{t("employee.name")}</th>
                <th className="px-4 py-3 font-medium text-gray-500">{t("employee.price")}</th>
                <th className="px-4 py-3 font-medium text-gray-500">{t("employee.stock")}</th>
                <th className="px-4 py-3 font-medium text-gray-500">{t("employee.ageRestricted")}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{product.sku}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                  <td className="px-4 py-3 font-semibold text-gold-600">
                    ${parseFloat(product.basePrice.toString()).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${
                      product.stockLevel === 0 ? "text-red-500" :
                      product.stockLevel <= 10 ? "text-orange-600" :
                      "text-gray-900"
                    }`}>
                      {product.stockLevel}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {product.isAgeRestricted && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                        {t("employee.ageRestricted")}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
