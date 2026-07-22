import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@kananos/database";
import { eq, and } from "drizzle-orm";

export async function PATCH(request: NextRequest) {
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

  const userId = Number(session.user.id);

  const tenantUser = await db
    .select()
    .from(schema.tenantUsers)
    .where(
      and(
        eq(schema.tenantUsers.userId, userId),
        eq(schema.tenantUsers.role, "employee")
      )
    )
    .limit(1)
    .then((r) => r[0]);

  const isAdmin = await db
    .select()
    .from(schema.tenantUsers)
    .where(
      and(
        eq(schema.tenantUsers.userId, userId),
        eq(schema.tenantUsers.role, "admin")
      )
    )
    .limit(1)
    .then((r) => r[0]);

  if (!tenantUser && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { error: "orderId and status are required" },
        { status: 400 }
      );
    }

    const validStatuses = ["shipped", "delivered", "paid", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    await db
      .update(schema.orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(schema.orders.id, orderId));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update order",
      },
      { status: 500 }
    );
  }
}
