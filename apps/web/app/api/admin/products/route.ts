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

export async function GET(request: NextRequest) {
  const gate = await getAdminTenant(request);
  if (gate.error) return gate.error;
  if (!db) return NextResponse.json({ error: "System unavailable" }, { status: 503 });
  const rows = await db.select().from(schema.products).where(eq(schema.products.tenantId, gate.tenantId)).orderBy(schema.products.name);
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const gate = await getAdminTenant(request);
  if (gate.error) return gate.error;
  if (!db) return NextResponse.json({ error: "System unavailable" }, { status: 503 });
  try {
    const b = await request.json();
    const name = String(b.name ?? "").trim();
    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
    const [row] = await db.insert(schema.products).values({
      tenantId: gate.tenantId,
      sku: String(b.sku ?? "").trim() || ("SKU-" + Date.now()),
      name,
      description: b.description ? String(b.description) : null,
      categoryId: b.categoryId ? Number(b.categoryId) : null,
      brandId: b.brandId ? Number(b.brandId) : null,
      imageUrl: b.imageUrl ? String(b.imageUrl) : null,
      basePrice: String(b.basePrice ?? "0"),
      wholesalePrice: b.wholesalePrice ? String(b.wholesalePrice) : null,
      stockLevel: b.stockLevel ? Number(b.stockLevel) : 0,
      isAgeRestricted: Boolean(b.isAgeRestricted),
      restrictedProductType: b.restrictedProductType ? String(b.restrictedProductType) : "none",
      isActive: true,
    }).returning();
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to create" }, { status: 500 });
  }
}
