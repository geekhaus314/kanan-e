import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import * as schema from "./schema";

async function main() {
  const client = postgres(process.env.DATABASE_URL!, { prepare: false });
  const db = drizzle(client, { schema });
  const products = await db
    .select()
    .from(schema.products)
    .where(eq(schema.products.tenantId, 1));
  for (const p of products) {
    console.log(p.sku, p.imageUrl ? "HAS_IMAGE" : "NO_IMAGE");
  }
  await client.end();
}
main();
