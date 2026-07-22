import { db, schema } from "@kananos/database";
import { eq, and } from "drizzle-orm";
import { getTenantBySlug } from "@/lib/tenant";
import { auth } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

export default async function EmployeeLayout({
  children,
  params,
}: {
  children: React.ReactNode;
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

  const nav = [
    { label: t("employee.dashboard"), href: `/${merchant}/employee` },
    { label: t("employee.orders"), href: `/${merchant}/employee/orders` },
    { label: t("employee.products"), href: `/${merchant}/employee/products` },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
          <Link
            href={`/${merchant}/employee`}
            className="text-sm font-bold text-gray-900"
          >
            {t("employee.portal")}
          </Link>
          <nav className="flex gap-4">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-gray-500 hover:text-gray-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          {tenantUser.role === "admin" && (
            <Link
              href={`/${merchant}/admin`}
              className="text-sm font-medium text-amber-600 hover:text-amber-700"
            >
              {t("admin.title")}
            </Link>
          )}
          <Link
            href={`/${merchant}`}
            className="ml-auto text-sm text-gray-400 hover:text-gray-600"
          >
            {t("employee.backToStore")}
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8">{children}</div>
    </div>
  );
}
