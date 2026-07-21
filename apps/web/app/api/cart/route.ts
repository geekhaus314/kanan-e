import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@kananos/database";
import { eq, and, sql } from "drizzle-orm";

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
    const { productId, quantity = 1, tenantId = 1 } = await request.json();

    const product = await db
      .select()
      .from(schema.products)
      .where(
        and(
          eq(schema.products.id, productId),
          eq(schema.products.isActive, true)
        )
      )
      .limit(1)
      .then((r) => r[0]);

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    if (product.stockLevel < quantity) {
      return NextResponse.json(
        { error: `Only ${product.stockLevel} units available` },
        { status: 400 }
      );
    }

    const userId = Number(session.user.id);
    const priceSnapshot = parseFloat(product.basePrice.toString());

    await db
      .insert(schema.cartItems)
      .values({
        tenantId,
        userId,
        productId,
        quantity,
        priceAtAddition: priceSnapshot.toFixed(2),
      })
      .onConflictDoUpdate({
        target: [
          schema.cartItems.tenantId,
          schema.cartItems.userId,
          schema.cartItems.productId,
        ],
        set: {
          quantity: sql`${schema.cartItems.quantity} + ${quantity}`,
          updatedAt: new Date(),
        },
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add to cart" },
      { status: 500 }
    );
  }
}

export async function GET() {
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

  const items = await db
    .select({
      id: schema.cartItems.id,
      productId: schema.cartItems.productId,
      quantity: schema.cartItems.quantity,
      priceAtAddition: schema.cartItems.priceAtAddition,
      productName: schema.products.name,
      sku: schema.products.sku,
      imageUrl: schema.products.imageUrl,
      basePrice: schema.products.basePrice,
      isAgeRestricted: schema.products.isAgeRestricted,
      stockLevel: schema.products.stockLevel,
    })
    .from(schema.cartItems)
    .innerJoin(
      schema.products,
      eq(schema.cartItems.productId, schema.products.id)
    )
    .where(eq(schema.cartItems.userId, userId));

  return NextResponse.json(items);
}

export async function DELETE(request: NextRequest) {
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
  const itemId = searchParams.get("itemId");

  if (itemId) {
    await db
      .delete(schema.cartItems)
      .where(
        and(
          eq(schema.cartItems.id, Number(itemId)),
          eq(schema.cartItems.userId, Number(session.user.id))
        )
      );
  } else {
    await db
      .delete(schema.cartItems)
      .where(eq(schema.cartItems.userId, Number(session.user.id)));
  }

  return NextResponse.json({ success: true });
}
