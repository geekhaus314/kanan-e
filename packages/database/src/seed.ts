import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and } from "drizzle-orm";
import * as schema from "./schema";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const client = postgres(databaseUrl, { prepare: false });
  const db = drizzle(client, { schema });

  console.log("Seeding KananOS...");

  const [platformTenant] = await db
    .insert(schema.tenants)
    .values({
      slug: "platform",
      name: "KananOS Platform",
      config: {},
      isActive: true,
    })
    .onConflictDoNothing()
    .returning();

  const [unitedTenant] = await db
    .insert(schema.tenants)
    .values({
      slug: "united",
      name: "United Distribution",
      domain: "united.kananos.com",
      config: {
        taxRate: 0.08,
        shippingFreeThreshold: 2500,
        currency: "USD",
        timezone: "America/Chicago",
      },
      isActive: true,
    })
    .onConflictDoNothing()
    .returning();

  const tenantId = unitedTenant?.id ?? 1;

  const adminEmail = "admin@uniteddistribution.com";
  const [adminUser] = await db
    .insert(schema.users)
    .values({
      email: adminEmail,
      name: "Fahmi Abukanan",
    })
    .onConflictDoNothing()
    .returning();

  if (adminUser) {
    await db.insert(schema.tenantUsers).values({
      tenantId,
      userId: adminUser.id,
      role: "admin",
      isWholesale: true,
    });
    console.log(`  Created admin: ${adminEmail}`);
  }

  const categoryData = [
    { name: "Cigarettes", slug: "cigarettes", displayOrder: 1 },
    { name: "Cigars", slug: "cigars", displayOrder: 2 },
    { name: "Pipe Tobacco", slug: "pipe-tobacco", displayOrder: 3 },
    { name: "Vape & E-Liquid", slug: "vape", displayOrder: 4 },
    { name: "Nicotine Pouches", slug: "nicotine-pouches", displayOrder: 5 },
    { name: "Smoking Accessories", slug: "accessories", displayOrder: 6 },
    { name: "CBD & Hemp", slug: "cbd-hemp", displayOrder: 7 },
    { name: "Candy & Snacks", slug: "candy-snacks", displayOrder: 8 },
    { name: "Beverages", slug: "beverages", displayOrder: 9 },
    { name: "General Merchandise", slug: "general", displayOrder: 10 },
  ];

  for (const cat of categoryData) {
    await db
      .insert(schema.categories)
      .values({ tenantId, ...cat, isActive: true })
      .onConflictDoNothing();
  }
  console.log(`  Created ${categoryData.length} categories`);

  const brandData = [
    { name: "Marlboro", slug: "marlboro" },
    { name: "Camel", slug: "camel" },
    { name: "Newport", slug: "newport" },
    { name: "Swisher Sweets", slug: "swisher-sweets" },
    { name: "Black & Mild", slug: "black-mild" },
    { name: "White Owl", slug: "white-owl" },
    { name: "ZYN", slug: "zyn" },
    { name: "VELO", slug: "velo" },
    { name: "Juice Head", slug: "juice-head" },
    { name: "Geek Bar", slug: "geek-bar" },
  ];

  for (const brand of brandData) {
    await db
      .insert(schema.brands)
      .values({ tenantId, ...brand, isActive: true })
      .onConflictDoNothing();
  }
  console.log(`  Created ${brandData.length} brands`);

  const productsData = [
    {
      sku: "MARLB-RED-1C",
      name: "Marlboro Red 100s — 1 Carton",
      description: "Full-flavor king size 100s. 10 packs per carton.",
      categoryId: 1,
      brandId: 1,
      basePrice: "89.99",
      wholesalePrice: "82.50",
      stockLevel: 500,
      isAgeRestricted: true,
      restrictedProductType: "tobacco",
    },
    {
      sku: "MARLB-GOLD-1C",
      name: "Marlboro Gold 100s — 1 Carton",
      description: "Smooth premium taste. 10 packs per carton.",
      categoryId: 1,
      brandId: 1,
      basePrice: "89.99",
      wholesalePrice: "82.50",
      stockLevel: 400,
      isAgeRestricted: true,
      restrictedProductType: "tobacco",
    },
    {
      sku: "CAMEL-CRUSH-1C",
      name: "Camel Crush 100s — 1 Carton",
      description: "Menthol capsule crushable for custom freshness.",
      categoryId: 1,
      brandId: 2,
      basePrice: "87.50",
      wholesalePrice: "80.00",
      stockLevel: 350,
      isAgeRestricted: true,
      restrictedProductType: "tobacco",
    },
    {
      sku: "NWPT-MNTHL-1C",
      name: "Newport Menthol 100s — 1 Carton",
      description: "Iconic menthol smoothness. 10 packs per carton.",
      categoryId: 1,
      brandId: 3,
      basePrice: "91.50",
      wholesalePrice: "84.00",
      stockLevel: 600,
      isAgeRestricted: true,
      restrictedProductType: "tobacco",
    },
    {
      sku: "SWISH-RILLO-BX",
      name: "Swisher Sweets Rillo — 50ct Box",
      description: "Original cigarillo. Sweet aroma, smooth draw.",
      categoryId: 2,
      brandId: 4,
      basePrice: "39.99",
      wholesalePrice: "35.00",
      stockLevel: 200,
      isAgeRestricted: true,
      restrictedProductType: "tobacco",
    },
    {
      sku: "BLKMLD-JAZZ-BX",
      name: "Black & Mild Jazz — 25ct Box",
      description: "Wood tip cigar with jazz blend.",
      categoryId: 2,
      brandId: 5,
      basePrice: "24.99",
      wholesalePrice: "21.50",
      stockLevel: 300,
      isAgeRestricted: true,
      restrictedProductType: "tobacco",
    },
    {
      sku: "ZYN-CLR-6MG-POUCH",
      name: "ZYN Cooler 6mg — 15ct Pouch",
      description: "Smooth nicotine pouch. No tobacco leaf.",
      categoryId: 5,
      brandId: 7,
      basePrice: "6.99",
      wholesalePrice: "5.25",
      stockLevel: 1000,
      isAgeRestricted: true,
      restrictedProductType: "nicotine_vape",
    },
    {
      sku: "ZYN-PEP-3MG-POUCH",
      name: "ZYN Peppermint 3mg — 15ct Pouch",
      description: "Refreshing peppermint nicotine pouch.",
      categoryId: 5,
      brandId: 7,
      basePrice: "6.99",
      wholesalePrice: "5.25",
      stockLevel: 1000,
      isAgeRestricted: true,
      restrictedProductType: "nicotine_vape",
    },
    {
      sku: "GEEK-MELO-MAX",
      name: "Geek Bar Meloso Max — 3000 Puffs",
      description: "Disposable vape. 5% nicotine. Rechargeable.",
      categoryId: 4,
      brandId: 10,
      basePrice: "14.99",
      wholesalePrice: "11.00",
      stockLevel: 250,
      isAgeRestricted: true,
      restrictedProductType: "nicotine_vape",
    },
    {
      sku: "JUICE-MNG-ICE-60ML",
      name: "Juice Head Mango Ice — 60mL",
      description: "Mango + menthol ice salt nicotine e-liquid.",
      categoryId: 4,
      brandId: 9,
      basePrice: "18.99",
      wholesalePrice: "14.50",
      stockLevel: 150,
      isAgeRestricted: true,
      restrictedProductType: "nicotine_vape",
    },
    {
      sku: "RAW-CN-1.25-100",
      name: "RAW Classic Cones 1.25\" — 100ct",
      description: "Unrefined natural rolling cones.",
      categoryId: 6,
      brandId: null,
      basePrice: "3.99",
      wholesalePrice: "2.75",
      stockLevel: 800,
      isAgeRestricted: false,
      restrictedProductType: "smoking_accessory",
    },
    {
      sku: "ZIPPO-BLK-MTL",
      name: "Zippo Black Matte Lighter",
      description: "Classic Zippo windproof lighter. Refillable.",
      categoryId: 6,
      brandId: null,
      basePrice: "24.99",
      wholesalePrice: "19.00",
      stockLevel: 120,
      isAgeRestricted: false,
      restrictedProductType: "none",
    },
  ];

  for (const product of productsData) {
    await db
      .insert(schema.products)
      .values({ tenantId, ...product, isActive: true })
      .onConflictDoNothing();
  }
  console.log(`  Created ${productsData.length} products`);

  const productRows = await db
    .select()
    .from(schema.products)
    .where(
      and(
        eq(schema.products.tenantId, tenantId),
        eq(schema.products.isActive, true)
      )
    );

  for (const product of productRows) {
    const bPrice = parseFloat(product.basePrice.toString());
    const tiers = [
      { minQuantity: 10, maxQuantity: 49, price: (bPrice * 0.95).toFixed(2) },
      { minQuantity: 50, maxQuantity: 99, price: (bPrice * 0.9).toFixed(2) },
      {
        minQuantity: 100,
        maxQuantity: null,
        price: (bPrice * 0.85).toFixed(2),
      },
    ];

    for (const tier of tiers) {
      await db
        .insert(schema.bulkPricingTiers)
        .values({
          productId: product.id,
          minQuantity: tier.minQuantity,
          maxQuantity: tier.maxQuantity,
          price: tier.price,
        })
        .onConflictDoNothing();
    }
  }
  console.log("  Created bulk pricing tiers");

  await client.end();
  console.log("Seed complete!");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
