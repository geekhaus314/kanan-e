import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@kananos/database";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!db) {
    return NextResponse.json(
      { error: "System unavailable" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { merchant, businessName, taxId, licenseNumber } = body;

    if (!merchant || !businessName || !licenseNumber) {
      return NextResponse.json(
        { error: "Business name and license number are required" },
        { status: 400 }
      );
    }

    const tenant = await db
      .select()
      .from(schema.tenants)
      .where(eq(schema.tenants.slug, merchant))
      .limit(1)
      .then((r) => r[0]);

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant not found" },
        { status: 404 }
      );
    }

    const userId = Number(session.user.id);

    const existing = await db
      .select()
      .from(schema.tenantUsers)
      .where(
        and(
          eq(schema.tenantUsers.userId, userId),
          eq(schema.tenantUsers.tenantId, tenant.id)
        )
      )
      .limit(1)
      .then((r) => r[0]);

    if (existing?.isWholesale) {
      return NextResponse.json(
        { error: "Already approved for wholesale" },
        { status: 400 }
      );
    }

    const licenseData = JSON.stringify({
      businessName,
      taxId: taxId || null,
      licenseNumber,
      submittedAt: new Date().toISOString(),
    });

    if (existing) {
      await db
        .update(schema.tenantUsers)
        .set({
          tobaccoLicense: licenseData,
          updatedAt: new Date(),
        })
        .where(eq(schema.tenantUsers.id, existing.id));
    } else {
      await db.insert(schema.tenantUsers).values({
        tenantId: tenant.id,
        userId,
        role: "user",
        isWholesale: false,
        tobaccoLicense: licenseData,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Registration failed",
      },
      { status: 500 }
    );
  }
}
