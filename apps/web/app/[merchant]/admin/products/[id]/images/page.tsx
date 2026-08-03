import { auth } from "@/lib/auth";
import { getTenantBySlug } from "@/lib/tenant";
import { db, schema } from "@kananos/database";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import ProductImagesManager from "./ProductImagesManager";

export default async function Page({
  params,
}: {
  params: Promise<{ merchant: string; id: string }>;
}) {
  const { merchant, id } = await params;
  const tenant = await getTenantBySlug(merchant);
  if (!tenant || !db) notFound();

  const session = await auth();
  if (!session?.user?.id) notFound();
  const tu = await db
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
  if (!tu || (tu.role !== "admin" && tu.role !== "root")) notFound();

  return (
    <div className="min-h-screen bg-gradient-surface">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <a
          href={`/${merchant}/admin/products/${id}`}
          className="mb-4 inline-block text-sm text-blue-400 hover:underline"
        >
          &larr; Back to product
        </a>
        <ProductImagesManager productId={Number(id)} merchant={merchant} />
      </div>
    </div>
  );
}
