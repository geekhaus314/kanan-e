import { db, schema } from "@kananos/database";
import { eq } from "drizzle-orm";
import { cache } from "react";

export const getTenantBySlug = cache(async (slug: string) => {
  if (!db) return null;

  const tenant = await db
    .select()
    .from(schema.tenants)
    .where(eq(schema.tenants.slug, slug))
    .limit(1)
    .then((r) => r[0]);

  return tenant ?? null;
});

export const getTenantById = cache(async (id: number) => {
  if (!db) return null;

  const tenant = await db
    .select()
    .from(schema.tenants)
    .where(eq(schema.tenants.id, id))
    .limit(1)
    .then((r) => r[0]);

  return tenant ?? null;
});
