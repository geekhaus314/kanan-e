import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, schema } from "@kananos/database";
import { eq, and, sql } from "drizzle-orm";

async function resolveTenant(
  request: NextRequest,
  body: Record<string, unknown>
): Promise<{ tenantId: number; error?: Response }> {
  if (!db) {
    return { tenantId: 0, error: NextResponse.json({ error: "System unavailable" }, { status: 503 }) };
  }
  const merchant = (body.merchant as string) || request.headers.get("x-merchant");
  if (!merchant) {
    return { tenantId: 0, error: NextResponse.json({ error: "Tenant required" }, { status: 400 }) };
  }
  const tenant = await db
    .select()
    .from(schema.tenants)
    .where(eq(schema.tenants.slug, merchant))
    .limit(1)
    .then((r) => r[0]);
  if (!tenant) {
    return { tenantId: 0, error: NextResponse.json({ error: "Tenant not found" }, { status: 404 }) };
  }
  return { tenantId: tenant.id };
}

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
    const { productId, quantity = 1, merchant } = body;

    const tenantResolution = await resolveTenant(request, body);
    if (tenantResolution.error) return tenantResolution.error;
    const tenantId = tenantResolution.tenantId;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID required" },
        { status: 400 }
      );
    }

    const product = await db
      .select()
      .from(schema.products)
      .where(
        and(
          eq(schema.products.id, Number(productId)),
          eq(schema.products.isActive, true),
          eq(schema.products.tenantId, tenantId)
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
        productId: Number(productId),
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
  const merchant = searchParams.get("merchant");
  if (!merchant) {
    return NextResponse.json(
      { error: "Merchant required" },
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
    .where(
      and(
        eq(schema.cartItems.userId, userId),
        eq(schema.cartItems.tenantId, tenant.id)
      )
    );

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
  const merchant = searchParams.get("merchant");

  if (!merchant) {
    return NextResponse.json(
      { error: "Merchant required" },
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

  if (itemId) {
    await db
      .delete(schema.cartItems)
      .where(
        and(
          eq(schema.cartItems.id, Number(itemId)),
          eq(schema.cartItems.userId, userId),
          eq(schema.cartItems.tenantId, tenant.id)
        )
      );
  } else {
    await db
      .delete(schema.cartItems)
      .where(
        and(
          eq(schema.cartItems.userId, userId),
          eq(schema.cartItems.tenantId, tenant.id)
        )
      );
  }

  return NextResponse.json({ success: true });
}
