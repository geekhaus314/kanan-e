import { db, schema } from "@kananos/database";
import { eq, and, asc, isNull, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  if (!db) {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");
  const query = searchParams.get("query");
  const categoryId = searchParams.get("categoryId");
  const limit = Math.min(
    Number(searchParams.get("limit") ?? 50),
    200
  );
  const offset = Number(searchParams.get("offset") ?? 0);

  if (!tenantId) {
    return NextResponse.json(
      { error: "tenantId is required" },
      { status: 400 }
    );
  }

  const conditions = [
    eq(schema.products.tenantId, Number(tenantId)),
    eq(schema.products.isActive, true),
    isNull(schema.products.deletedAt),
  ];

  if (query) {
    const pattern = `%${query.replace(/[%_\\]/g, "")}%`;
    conditions.push(
      sql`(${schema.products.name} ILIKE ${pattern} OR ${schema.products.sku} ILIKE ${pattern})`
    );
  }

  if (categoryId) {
    conditions.push(eq(schema.products.categoryId, Number(categoryId)));
  }

  const products = await db
    .select()
    .from(schema.products)
    .where(and(...conditions))
    .orderBy(asc(schema.products.name))
    .limit(limit)
    .offset(offset);

  return NextResponse.json(products);
}
