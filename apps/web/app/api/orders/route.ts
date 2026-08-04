import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@kananos/database";
import { eq, and, inArray, sql } from "drizzle-orm";

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
    const { merchant, items, total, shippingAddress } = body;

    if (!merchant || !items?.length || !total) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    // Validate stock levels and verify active state for all items
    const productIds = items.map(
      (item: { productId: number; quantity: number; price: number }) => item.productId
    );

    const dbProducts = await db
      .select()
      .from(schema.products)
      .where(
        and(
          inArray(schema.products.id, productIds),
          eq(schema.products.tenantId, tenant.id),
          eq(schema.products.isActive, true)
        )
      );

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product ID ${item.productId} not found or inactive` },
          { status: 400 }
        );
      }
      if (product.stockLevel < item.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for '${product.name}'. ${product.stockLevel} units available, ${item.quantity} requested.`,
          },
          { status: 400 }
        );
      }
    }

    const [order] = await db
      .insert(schema.orders)
      .values({
        tenantId: tenant.id,
        userId,
        status: "pending_payment",
        type: "retail",
        totalAmount: total.toFixed(2),
        shippingAddress,
        notes: body.notes || null,
      })
      .returning();

    if (!order) {
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }

    const orderItems = items.map(
      (item: { productId: number; quantity: number; price: number }) => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        pricePerUnit: item.price.toFixed(2),
        lineTotal: (item.price * item.quantity).toFixed(2),
      })
    );

    await db.insert(schema.orderItems).values(orderItems);

    // Decrement stock levels for ordered products
    for (const item of items) {
      await db
        .update(schema.products)
        .set({
          stockLevel: sql`${schema.products.stockLevel} - ${item.quantity}`,
          updatedAt: new Date(),
        })
        .where(eq(schema.products.id, item.productId));
    }

    await db
      .delete(schema.cartItems)
      .where(
        and(
          eq(schema.cartItems.userId, userId),
          eq(schema.cartItems.tenantId, tenant.id)
        )
      );

    return NextResponse.json({
      success: true,
      orderId: order.id,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create order" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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

  const { searchParams } = new URL(request.url);
  const tenantSlug = searchParams.get("merchant") || searchParams.get("tenant");

  let tenantId: number | undefined;
  if (tenantSlug) {
    const tenant = await db
      .select()
      .from(schema.tenants)
      .where(eq(schema.tenants.slug, tenantSlug))
      .limit(1)
      .then((r) => r[0]);
    if (tenant) tenantId = tenant.id;
  }

  const userId = Number(session.user.id);
  const conditions = [eq(schema.orders.userId, userId)];
  if (tenantId) conditions.push(eq(schema.orders.tenantId, tenantId));

  const orders = await db
    .select()
    .from(schema.orders)
    .where(and(...conditions))
    .orderBy(schema.orders.createdAt)
    .limit(50);

  return NextResponse.json(orders);
}
