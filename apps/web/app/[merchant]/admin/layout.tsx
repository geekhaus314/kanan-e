import { db, schema } from "@kananos/database";
import { eq, and } from "drizzle-orm";
import { getTenantBySlug } from "@/lib/tenant";
import { auth } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({
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

  const nav = [
    { label: t("admin.dashboard"), href: `/${merchant}/admin` },
    { label: t("admin.ageVerifications"), href: `/${merchant}/admin/age-verifications` },
  ];

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
          <Link
            href={`/${merchant}/admin`}
            className="text-sm font-bold text-gray-900"
          >
            {t("admin.title")}
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
          <Link
            href={`/${merchant}`}
            className="mr-auto text-sm text-gray-400 hover:text-gray-600"
          >
            {t("admin.backToStore")}
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8">{children}</div>
    </div>
  );
}
