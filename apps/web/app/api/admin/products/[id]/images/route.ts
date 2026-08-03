import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { db, schema } from "@kananos/database";
import { eq, and } from "drizzle-orm";
import { getAdminTenant } from "@/lib/admin";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

function uploadsRoot() {
  return path.join(process.cwd(), "public", "uploads", "products");
}

function publicUrlFor(rel: string) {
  // rel is relative to public/, e.g. uploads/products/.../file.jpg
  return "/" + rel.split(path.sep).join("/");
}

async function listImages(productId: number): Promise<string[]> {
  if (!db) return [];
  const [row] = await db
    .select({ urls: schema.products.imageUrls })
    .from(schema.products)
    .where(eq(schema.products.id, productId))
    .limit(1);
  return Array.isArray(row?.urls) ? (row!.urls as string[]) : [];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await getAdminTenant(request);
  if ("error" in gate) return gate.error;
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId))
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  const [product] = await db!
    .select({ tenantId: schema.products.tenantId })
    .from(schema.products)
    .where(eq(schema.products.id, productId))
    .limit(1);
  if (!product || product.tenantId !== gate.tenantId)
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  return NextResponse.json({ images: await listImages(productId) });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await getAdminTenant(request);
  if ("error" in gate) return gate.error;
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId))
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });

  const [product] = await db!
    .select({ tenantId: schema.products.tenantId })
    .from(schema.products)
    .where(eq(schema.products.id, productId))
    .limit(1);
  if (!product || product.tenantId !== gate.tenantId)
    return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File))
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!ALLOWED.has(file.type))
    return NextResponse.json(
      { error: `Unsupported type: ${file.type || "unknown"}` },
      { status: 415 }
    );
  if (file.size > MAX_BYTES)
    return NextResponse.json({ error: "File too large (max 8MB)" }, { status: 413 });

  const tenant = await db!
    .select({ slug: schema.tenants.slug })
    .from(schema.tenants)
    .where(eq(schema.tenants.id, gate.tenantId))
    .limit(1)
    .then((r) => r[0]);
  const tenantSlug = tenant?.slug ?? String(gate.tenantId);

  const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const safeName = `${randomUUID()}.${ext}`;
  const dir = path.join(uploadsRoot(), tenantSlug, String(productId));
  await fs.mkdir(dir, { recursive: true });
  const absPath = path.join(dir, safeName);
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(absPath, buf);

  const rel = path.join("uploads", "products", tenantSlug, String(productId), safeName);
  const url = publicUrlFor(rel);

  // Append to product.imageUrls (jsonb string[]) keeping order.
  const current = await listImages(productId);
  const next = [...current, url];
  await db!
    .update(schema.products)
    .set({ imageUrls: next, imageUrl: current.length ? current[0] : url })
    .where(eq(schema.products.id, productId));

  return NextResponse.json({ url, images: next }, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await getAdminTenant(request);
  if ("error" in gate) return gate.error;
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId))
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });

  const [product] = await db!
    .select({ tenantId: schema.products.tenantId })
    .from(schema.products)
    .where(eq(schema.products.id, productId))
    .limit(1);
  if (!product || product.tenantId !== gate.tenantId)
    return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const url = request.nextUrl.searchParams.get("url");
  if (!url)
    return NextResponse.json({ error: "url query param required" }, { status: 400 });

  const current = await listImages(productId);
  if (!current.includes(url))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Best-effort delete of the physical file.
  try {
    const rel = url.replace(/^\//, "").split("/").join(path.sep);
    await fs.unlink(path.join(process.cwd(), "public", rel));
  } catch {
    // ignore missing file
  }

  const next = current.filter((u) => u !== url);
  await db!
    .update(schema.products)
    .set({ imageUrls: next, imageUrl: next[0] ?? null })
    .where(eq(schema.products.id, productId));

  return NextResponse.json({ images: next });
}
