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
    { name: "Glassware & Accessories", slug: "glassware", displayOrder: 6 },
    { name: "Smoking Accessories", slug: "accessories", displayOrder: 7 },
    { name: "CBD & Hemp", slug: "cbd-hemp", displayOrder: 8 },
    { name: "Candy & Snacks", slug: "candy-snacks", displayOrder: 9 },
    { name: "Beverages", slug: "beverages", displayOrder: 10 },
    { name: "General Merchandise", slug: "general", displayOrder: 11 },
  ];

  for (const cat of categoryData) {
    await db
      .insert(schema.categories)
      .values({ tenantId, ...cat, isActive: true })
      .onConflictDoNothing();
  }
  console.log(`  Created ${categoryData.length} categories`);

  const categoryRows = await db
    .select()
    .from(schema.categories)
    .where(
      and(
        eq(schema.categories.tenantId, tenantId),
        eq(schema.categories.isActive, true)
      )
    );
  const catBySlug: Record<string, number> = {};
  for (const c of categoryRows) {
    catBySlug[c.slug] = c.id;
  }

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
    { name: "RAW", slug: "raw" },
    { name: "Headway", slug: "headway" },
    { name: "Pulsar", slug: "pulsar" },
    { name: "HEMPER", slug: "hemper" },
    { name: "SMOKEA", slug: "smokea" },
  ];

  for (const brand of brandData) {
    await db
      .insert(schema.brands)
      .values({ tenantId, ...brand, isActive: true })
      .onConflictDoNothing();
  }
  console.log(`  Created ${brandData.length} brands`);

  const brandRows = await db
    .select()
    .from(schema.brands)
    .where(
      and(
        eq(schema.brands.tenantId, tenantId),
        eq(schema.brands.isActive, true)
      )
    );
  const brandBySlug: Record<string, number> = {};
  for (const b of brandRows) {
    brandBySlug[b.slug] = b.id;
  }

  const productsData = [
    {
      sku: "MARLB-RED-1C",
      name: "Marlboro Red 100s — 1 Carton",
      description: "Full-flavor king size 100s. 10 packs per carton.",
      categorySlug: "cigarettes",
      brandSlug: "marlboro",
      basePrice: "89.99",
      wholesalePrice: "82.50",
      stockLevel: 500,
      isAgeRestricted: true,
      restrictedProductType: "tobacco",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/c/ca/American_duty-free_Marlboro.jpg",
    },
    {
      sku: "MARLB-GOLD-1C",
      name: "Marlboro Gold 100s — 1 Carton",
      description: "Smooth premium taste. 10 packs per carton.",
      categorySlug: "cigarettes",
      brandSlug: "marlboro",
      basePrice: "89.99",
      wholesalePrice: "82.50",
      stockLevel: 400,
      isAgeRestricted: true,
      restrictedProductType: "tobacco",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/c/ca/American_duty-free_Marlboro.jpg",
    },
    {
      sku: "CAMEL-CRUSH-1C",
      name: "Camel Crush 100s — 1 Carton",
      description: "Menthol capsule crushable for custom freshness.",
      categorySlug: "cigarettes",
      brandSlug: "camel",
      basePrice: "87.50",
      wholesalePrice: "80.00",
      stockLevel: 350,
      isAgeRestricted: true,
      restrictedProductType: "tobacco",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/6/6d/Camel_cigarette_pack_%28softpack%29_on_white_background.jpg",
    },
    {
      sku: "NWPT-MNTHL-1C",
      name: "Newport Menthol 100s — 1 Carton",
      description: "Iconic menthol smoothness. 10 packs per carton.",
      categorySlug: "cigarettes",
      brandSlug: "newport",
      basePrice: "91.50",
      wholesalePrice: "84.00",
      stockLevel: 600,
      isAgeRestricted: true,
      restrictedProductType: "tobacco",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/0/0e/Newport_cigarettes.jpg",
    },
    {
      sku: "SWISH-RILLO-BX",
      name: "Swisher Sweets Rillo — 50ct Box",
      description: "Original cigarillo. Sweet aroma, smooth draw.",
      categorySlug: "cigars",
      brandSlug: "swisher-sweets",
      basePrice: "39.99",
      wholesalePrice: "35.00",
      stockLevel: 200,
      isAgeRestricted: true,
      restrictedProductType: "tobacco",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/9/9b/Philliesblunt.png",
    },
    {
      sku: "BLKMLD-JAZZ-BX",
      name: "Black & Mild Jazz — 25ct Box",
      description: "Wood tip cigar with jazz blend.",
      categorySlug: "cigars",
      brandSlug: "black-mild",
      basePrice: "24.99",
      wholesalePrice: "21.50",
      stockLevel: 300,
      isAgeRestricted: true,
      restrictedProductType: "tobacco",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d8/Blacknmildimage.jpg",
    },
    {
      sku: "ZYN-CLR-6MG-POUCH",
      name: "ZYN Cooler 6mg — 15ct Pouch",
      description: "Smooth nicotine pouch. No tobacco leaf.",
      categorySlug: "nicotine-pouches",
      brandSlug: "zyn",
      basePrice: "6.99",
      wholesalePrice: "5.25",
      stockLevel: 1000,
      isAgeRestricted: true,
      restrictedProductType: "nicotine_vape",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/89/ZYN_US_Nicotine_Pouches.jpg",
    },
    {
      sku: "ZYN-PEP-3MG-POUCH",
      name: "ZYN Peppermint 3mg — 15ct Pouch",
      description: "Refreshing peppermint nicotine pouch.",
      categorySlug: "nicotine-pouches",
      brandSlug: "zyn",
      basePrice: "6.99",
      wholesalePrice: "5.25",
      stockLevel: 1000,
      isAgeRestricted: true,
      restrictedProductType: "nicotine_vape",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/89/ZYN_US_Nicotine_Pouches.jpg",
    },
    {
      sku: "GEEK-MELO-MAX",
      name: "Geek Bar Meloso Max — 3000 Puffs",
      description: "Disposable vape. 5% nicotine. Rechargeable.",
      categorySlug: "vape",
      brandSlug: "geek-bar",
      basePrice: "14.99",
      wholesalePrice: "11.00",
      stockLevel: 250,
      isAgeRestricted: true,
      restrictedProductType: "nicotine_vape",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/2c/Collection_of_disposable_ecigartte.jpg",
    },
    {
      sku: "JUICE-MNG-ICE-60ML",
      name: "Juice Head Mango Ice — 60mL",
      description: "Mango + menthol ice salt nicotine e-liquid.",
      categorySlug: "vape",
      brandSlug: "juice-head",
      basePrice: "18.99",
      wholesalePrice: "14.50",
      stockLevel: 150,
      isAgeRestricted: true,
      restrictedProductType: "nicotine_vape",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/b/ba/E-liquids_being_poured_into_various_e-cigarette_devices.png",
    },
    {
      sku: "RAW-CN-1.25-100",
      name: "RAW Classic Cones 1.25\" — 100ct",
      description: "Unrefined natural rolling cones.",
      categorySlug: "accessories",
      brandSlug: "raw",
      basePrice: "3.99",
      wholesalePrice: "2.75",
      stockLevel: 800,
      isAgeRestricted: false,
      restrictedProductType: "smoking_accessory",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/3/34/Rolling_papers_filter_cigarette_making_tools.jpg",
    },
    {
      sku: "ZIPPO-BLK-MTL",
      name: "Zippo Black Matte Lighter",
      description: "Classic Zippo windproof lighter. Refillable.",
      categorySlug: "accessories",
      brandSlug: null,
      basePrice: "24.99",
      wholesalePrice: "19.00",
      stockLevel: 120,
      isAgeRestricted: false,
      restrictedProductType: "none",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/8d/Zippo_Detail.jpg",
    },
    {
      sku: "GLASS-BEAKER-12",
      name: "Headway 12\" Beaker Bong — Clear Glass",
      description: "Classic 12-inch beaker bong. Thick borosilicate glass, ice catcher, 14mm female joint. Smooth rips every time.",
      categorySlug: "glassware",
      brandSlug: "headway",
      basePrice: "44.99",
      wholesalePrice: "32.00",
      stockLevel: 75,
      isAgeRestricted: true,
      restrictedProductType: "smoking_accessory",
      imageUrl: "https://smokea.com/cdn/shop/files/headway-8-5mm-beaker-bong-clear-1246190374_800x.jpg?v=1782504671",
    },
    {
      sku: "GLASS-SPOON-4",
      name: "SMOKEA 4\" Glass Spoon Pipe — Assorted Colors",
      description: "Hand-blown glass spoon pipe. Perfect for dry herbs. Easy to clean and portable.",
      categorySlug: "glassware",
      brandSlug: "smokea",
      basePrice: "9.99",
      wholesalePrice: "6.50",
      stockLevel: 200,
      isAgeRestricted: true,
      restrictedProductType: "smoking_accessory",
      imageUrl: "https://smokea.com/cdn/shop/products/smokea-5-glass-hand-pipe-14600915222630_800x.jpg?v=1628283637",
    },
    {
      sku: "GRIND-4PC-ALUM",
      name: "HEMPER 4-Piece Aluminum Herb Grinder — 2.2\"",
      description: "Premium aluminum grinder with diamond-cut teeth, mesh screen kief catcher, and magnetic lid. Crushes herbs effortlessly.",
      categorySlug: "glassware",
      brandSlug: "hemper",
      basePrice: "29.99",
      wholesalePrice: "21.00",
      stockLevel: 150,
      isAgeRestricted: false,
      restrictedProductType: "smoking_accessory",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d4/Herb_grinder.jpg",
    },
    {
      sku: "GLASS-CHILLUM-3",
      name: "Pulsar 3\" Glass Chillum — Pyrex",
      description: "Simple yet elegant glass chillum. Durable Pyrex glass, easy to pack and clean. Great for on-the-go.",
      categorySlug: "glassware",
      brandSlug: "pulsar",
      basePrice: "7.99",
      wholesalePrice: "5.00",
      stockLevel: 300,
      isAgeRestricted: true,
      restrictedProductType: "smoking_accessory",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/5/53/Glass_chillum.jpg",
    },
    {
      sku: "NECTAR-STARTER",
      name: "Pulsar Nectar Collector Kit — Glass & Titanium",
      description: "Complete nectar collector set with glass body, titanium tip, silicone straw, and cleaning brush. Perfect for concentrates.",
      categorySlug: "glassware",
      brandSlug: "pulsar",
      basePrice: "34.99",
      wholesalePrice: "25.00",
      stockLevel: 60,
      isAgeRestricted: true,
      restrictedProductType: "smoking_accessory",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e9/Dab_tool_and_nectar_collector.jpg",
    },
    {
      sku: "ROLL-TRAY-METAL",
      name: "SMOKEA 12\" x 8\" Rolling Tray — Magnetic Lid",
      description: "Large rolling tray with magnetic closure lid. Built-in storage compartment. Keeps your herbs and tools organized.",
      categorySlug: "glassware",
      brandSlug: "smokea",
      basePrice: "16.99",
      wholesalePrice: "11.50",
      stockLevel: 120,
      isAgeRestricted: false,
      restrictedProductType: "smoking_accessory",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Rolling_tray.jpg",
    },
    {
      sku: "ASH-CATCH-14MM",
      name: "Headway 14mm Showerhead Ash Catcher",
      description: "14mm male to 14mm female showerhead ash catcher. Keeps your piece clean. Slitted diffuser for smooth hits.",
      categorySlug: "glassware",
      brandSlug: "headway",
      basePrice: "22.99",
      wholesalePrice: "16.00",
      stockLevel: 85,
      isAgeRestricted: true,
      restrictedProductType: "smoking_accessory",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/40/Glass_bong_parts.jpg",
    },
    {
      sku: "STORAGE-JAR-8OZ",
      name: "HEMPER 8oz UV Glass Storage Jar — Airtight",
      description: "UV-protective glass jar with airtight silicone seal. Keeps herbs fresh for months. 8oz capacity.",
      categorySlug: "glassware",
      brandSlug: "hemper",
      basePrice: "12.99",
      wholesalePrice: "8.50",
      stockLevel: 400,
      isAgeRestricted: false,
      restrictedProductType: "smoking_accessory",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/9/9e/Mason_jar_with_herbs.jpg",
    },
  ];

  for (const product of productsData) {
    const { categorySlug, brandSlug, ...productValues } = product;
    await db
      .insert(schema.products)
      .values({
        tenantId,
        ...productValues,
        categoryId: catBySlug[categorySlug],
        brandId: brandSlug ? brandBySlug[brandSlug] : null,
        isActive: true,
      })
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
