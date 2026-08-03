import { db, schema } from "@kananos/database";
import { eq, and } from "drizzle-orm";
import { getTenantBySlug } from "@/lib/tenant";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { ProductForm } from "../ProductForm";

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ merchant: string }>;
}) {
  const { merchant } = await params;
  const tenant = await getTenantBySlug(merchant);
  if (!tenant || !db) notFound();
  const session = await auth();
  if (!session?.user?.id) redirect(`/${merchant}/auth/signin`);
  const tu = await db.select().from(schema.tenantUsers).where(and(eq(schema.tenantUsers.userId, Number(session.user.id)), eq(schema.tenantUsers.tenantId, tenant.id))).limit(1).then((r) => r[0]);
  if (!tu || tu.role !== "admin") notFound();

  const [categories, brands] = await Promise.all([
    db.select({ id: schema.categories.id, name: schema.categories.name }).from(schema.categories).where(eq(schema.categories.tenantId, tenant.id)),
    db.select({ id: schema.brands.id, name: schema.brands.name }).from(schema.brands).where(eq(schema.brands.tenantId, tenant.id)),
  ]);

  return (
    <div className="min-h-screen bg-gradient-surface">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-black text-gray-100">New Product</h1>
        <ProductForm merchant={merchant} categories={categories} brands={brands} />
      </div>
    </div>
  );
}
