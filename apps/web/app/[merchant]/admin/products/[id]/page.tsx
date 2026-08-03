import { db, schema } from "@kananos/database";
import { eq, and } from "drizzle-orm";
import { getTenantBySlug } from "@/lib/tenant";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { ProductForm } from "../ProductForm";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ merchant: string; id: string }>;
}) {
  const { merchant, id } = await params;
  const tenant = await getTenantBySlug(merchant);
  if (!tenant || !db) notFound();
  const session = await auth();
  if (!session?.user?.id) redirect(`/${merchant}/auth/signin`);
  const tu = await db.select().from(schema.tenantUsers).where(and(eq(schema.tenantUsers.userId, Number(session.user.id)), eq(schema.tenantUsers.tenantId, tenant.id))).limit(1).then((r) => r[0]);
  if (!tu || tu.role !== "admin") notFound();

  const [product, categories, brands] = await Promise.all([
    db.select().from(schema.products).where(and(eq(schema.products.id, Number(id)), eq(schema.products.tenantId, tenant.id))).limit(1).then((r) => r[0]),
    db.select({ id: schema.categories.id, name: schema.categories.name }).from(schema.categories).where(eq(schema.categories.tenantId, tenant.id)),
    db.select({ id: schema.brands.id, name: schema.brands.name }).from(schema.brands).where(eq(schema.brands.tenantId, tenant.id)),
  ]);
  if (!product) notFound();

  const initial: Record<string, string | number | boolean | null> = {
    name: product.name,
    sku: product.sku,
    description: product.description,
    categoryId: product.categoryId,
    brandId: product.brandId,
    imageUrl: product.imageUrl,
    basePrice: product.basePrice.toString(),
    wholesalePrice: product.wholesalePrice?.toString() ?? "",
    stockLevel: product.stockLevel,
    isAgeRestricted: product.isAgeRestricted,
    restrictedProductType: product.restrictedProductType,
    isActive: product.isActive,
  };

  return (
    <div className="min-h-screen bg-gradient-surface">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-black text-gray-100">Edit Product</h1>
        <a href={`/{merchant}/admin/products/{id}/images`} className="mb-6 inline-block text-sm text-blue-400 hover:underline">Manage photos &rarr;</a>
        <ProductForm merchant={merchant} categories={categories} brands={brands} initial={initial} productId={product.id} />
      </div>
    </div>
  );
}
