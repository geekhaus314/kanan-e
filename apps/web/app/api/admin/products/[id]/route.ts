import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@kananos/database";
import { eq, and } from "drizzle-orm";

async function getAdminTenant(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!db) return { error: NextResponse.json({ error: "System unavailable" }, { status: 503 }) };
  const merchant = request.nextUrl.searchParams.get("merchant");
  if (!merchant) return { error: NextResponse.json({ error: "Merchant required" }, { status: 400 }) };
  const tenant = await db.select().from(schema.tenants).where(eq(schema.tenants.slug, merchant)).limit(1).then((r) => r[0]);
  if (!tenant) return { error: NextResponse.json({ error: "Tenant not found" }, { status: 404 }) };
  const tu = await db.select().from(schema.tenantUsers).where(and(eq(schema.tenantUsers.userId, Number(session.user.id)), eq(schema.tenantUsers.tenantId, tenant.id))).limit(1).then((r) => r[0]);
  if (!tu || tu.role !== "admin") return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { tenantId: tenant.id };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await getAdminTenant(request);
  if (gate.error) return gate.error;
  if (!db) return NextResponse.json({ error: "System unavailable" }, { status: 503 });
  const id = Number((await params).id);
  try {
    const b = await request.json();
    const [row] = await db.update(schema.products)
      .set({
        name: b.name !== undefined ? String(b.name) : undefined,
        description: b.description !== undefined ? (b.description ? String(b.description) : null) : undefined,
        categoryId: b.categoryId !== undefined ? (b.categoryId ? Number(b.categoryId) : null) : undefined,
        brandId: b.brandId !== undefined ? (b.brandId ? Number(b.brandId) : null) : undefined,
        imageUrl: b.imageUrl !== undefined ? (b.imageUrl ? String(b.imageUrl) : null) : undefined,
        basePrice: b.basePrice !== undefined ? String(b.basePrice) : undefined,
        wholesalePrice: b.wholesalePrice !== undefined ? (b.wholesalePrice ? String(b.wholesalePrice) : null) : undefined,
        stockLevel: b.stockLevel !== undefined ? Number(b.stockLevel) : undefined,
        isAgeRestricted: b.isAgeRestricted !== undefined ? Boolean(b.isAgeRestricted) : undefined,
        restrictedProductType: b.restrictedProductType !== undefined ? String(b.restrictedProductType) : undefined,
        isActive: b.isActive !== undefined ? Boolean(b.isActive) : undefined,
        updatedAt: new Date(),
      })
      .where(and(eq(schema.products.id, id), eq(schema.products.tenantId, gate.tenantId)))
      .returning();
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await getAdminTenant(request);
  if (gate.error) return gate.error;
  if (!db) return NextResponse.json({ error: "System unavailable" }, { status: 503 });
  const id = Number((await params).id);
  await db.update(schema.products)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(schema.products.id, id), eq(schema.products.tenantId, gate.tenantId)));
  return NextResponse.json({ success: true });
}
