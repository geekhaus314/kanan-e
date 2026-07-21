import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@kananos/database";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  if (!db) {
    return NextResponse.json(
      { error: "System unavailable" },
      { status: 503 }
    );
  }

  try {
    const { name, email, password, merchant } = await request.json();

    if (!email || !password || !merchant) {
      return NextResponse.json(
        { error: "Email, password, and merchant are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
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
        { error: "Invalid merchant" },
        { status: 400 }
      );
    }

    const existingUser = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1)
      .then((r) => r[0]);

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const [user] = await db
      .insert(schema.users)
      .values({ name: name || null, email })
      .returning();

    if (!user) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    await db
      .insert(schema.tenantUsers)
      .values({
        tenantId: tenant.id,
        userId: user.id,
        role: "user",
        isWholesale: false,
      })
      .onConflictDoNothing({
        target: [
          schema.tenantUsers.tenantId,
          schema.tenantUsers.userId,
        ],
      });

    return NextResponse.json({ success: true, userId: user.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sign up failed" },
      { status: 500 }
    );
  }
}
