import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@kananos/database";
import { eq, and } from "drizzle-orm";

export type AdminGate =
  | { tenantId: number }
  | { error: NextResponse };

// Resolves the tenant for an admin/root request. Requires a `merchant` query
// param (tenant slug) and that the session user is admin or root for it.
export async function getAdminTenant(request: NextRequest): Promise<AdminGate> {
  const session = await auth();
  if (!session?.user?.id)
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!db)
    return { error: NextResponse.json({ error: "System unavailable" }, { status: 503 }) };
  const merchant = request.nextUrl.searchParams.get("merchant");
  if (!merchant)
    return { error: NextResponse.json({ error: "Merchant required" }, { status: 400 }) };
  const tenant = await db
    .select()
    .from(schema.tenants)
    .where(eq(schema.tenants.slug, merchant))
    .limit(1)
    .then((r) => r[0]);
  if (!tenant)
    return { error: NextResponse.json({ error: "Tenant not found" }, { status: 404 }) };
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
  if (!tu || (tu.role !== "admin" && tu.role !== "root"))
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { tenantId: tenant.id };
}
