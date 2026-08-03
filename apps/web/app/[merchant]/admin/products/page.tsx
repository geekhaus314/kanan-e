import { db, schema } from "@kananos/database";
import { eq, and, asc } from "drizzle-orm";
import { getTenantBySlug } from "@/lib/tenant";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminProductsPage({
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

  const [products, categories] = await Promise.all([
    db.select().from(schema.products).where(eq(schema.products.tenantId, tenant.id)).orderBy(asc(schema.products.name)),
    db.select().from(schema.categories).where(eq(schema.categories.tenantId, tenant.id)).orderBy(asc(schema.categories.displayOrder)),
  ]);
  const catName = (id: number | null) => categories.find((c) => c.id === id)?.name ?? "—";

  return (
    <div className="min-h-screen bg-gradient-surface">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-black text-gray-100">Products</h1>
          <Link href={`/${merchant}/admin/products/new`} className="btn-premium rounded-xl px-5 py-2.5 text-sm font-bold">
            + New Product
          </Link>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="px-4 py-3 font-medium text-gray-500">SKU</th>
                <th className="px-4 py-3 font-medium text-gray-500">Name</th>
                <th className="px-4 py-3 font-medium text-gray-500">Category</th>
                <th className="px-4 py-3 font-medium text-gray-500">Price</th>
                <th className="px-4 py-3 font-medium text-gray-500">Stock</th>
                <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-white/5">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.sku ?? "—"}</td>
                  <td className="px-4 py-3 font-medium text-gray-100">{p.name}</td>
                  <td className="px-4 py-3 text-gray-400">{catName(p.categoryId)}</td>
                  <td className="px-4 py-3 font-semibold text-gold-400">${parseFloat(p.basePrice.toString()).toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-400">{p.stockLevel}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.isActive ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                      {p.isActive ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/${merchant}/admin/products/${p.id}`} className="text-sm font-medium text-gold-400 hover:underline">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">No products yet. Click "+ New Product".</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
