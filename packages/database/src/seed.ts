import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import bcrypt from "bcryptjs";
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
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "UnitedDist2024!";
  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);
  const [adminUser] = await db
    .insert(schema.users)
    .values({
      email: adminEmail,
      name: "Fahmi Abukanan",
      passwordHash: adminPasswordHash,
    })
    .onConflictDoNothing()
    .returning();

  if (adminUser) {
    console.log(`  Admin login: ${adminEmail} / ${adminPassword}`);
  }

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
    { name: "Cigars & Tobacco", slug: "cigars-tobacco", displayOrder: 2 },
    { name: "Vape & E-Liquid", slug: "vape", displayOrder: 3 },
    { name: "Nicotine Pouches", slug: "nicotine-pouches", displayOrder: 4 },
    { name: "Dab & Vaporizers", slug: "vaporizers", displayOrder: 5 },
    { name: "Grinders & Accessories", slug: "grinders-torches", displayOrder: 6 },
    { name: "Energy & Beverages", slug: "beverages", displayOrder: 7 },
    { name: "Smoking Accessories", slug: "accessories", displayOrder: 8 },
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
    { name: "ZYN", slug: "zyn" },
    { name: "VELO", slug: "velo" },
    { name: "Geek Bar", slug: "geek-bar" },
    { name: "RAZ", slug: "raz" },
    { name: "Juice Head", slug: "juice-head" },
    { name: "RAW", slug: "raw" },
    { name: "Zippo", slug: "zippo" },
    { name: "Puffco", slug: "puffco" },
    { name: "Yocan", slug: "yocan" },
    { name: "Santa Cruz Shredder", slug: "santa-cruz-shredder" },
    { name: "Monster", slug: "monster" },
    { name: "Red Bull", slug: "red-bull" },
  ];

  for (const brand of brandData) {
    await db
      .insert(schema.brands)
      .values({ tenantId, ...brand, isActive: true })
      .onConflictDoNothing();
  }
  console.log(`  Created ${brandData.length} brands`);

  // Real product photos supplied via product-images.csv (sku,imageUrl).
  // Falls back to WIKI_IMG_URLS, then to brand tile placeholder.
  const WIKI_IMG_URLS: Record<string, string> = {
    'MARLB-RED-1C': 'https://upload.wikimedia.org/wikipedia/commons/c/ca/American_duty-free_Marlboro.jpg',
    'CAMEL-CRUSH-1C': 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Camel_cigarette_pack_%28softpack%29_on_white_background.jpg',
    'NWPT-MNTHL-1C': 'https://upload.wikimedia.org/wikipedia/commons/0/0e/Newport_cigarettes.jpg',
    'SWISH-RILLO-BX': 'https://upload.wikimedia.org/wikipedia/commons/9/9b/Philliesblunt.png',
    'BLKMLD-JAZZ-BX': 'https://upload.wikimedia.org/wikipedia/commons/d/d8/Blacknmildimage.jpg',
  };
  const img = (sku: string) => WIKI_IMG_URLS[sku] ?? null;

  // Optional operator-supplied image map: packages/database/product-images.csv
  const imageMap: Record<string, string> = {};
  try {
    const { readFileSync } = await import("fs");
    const { resolve } = await import("path");
    const csvPath = resolve(process.cwd(), "packages/database/product-images.csv");
    const raw = readFileSync(csvPath, "utf-8").trim().split("\n");
    for (const line of raw) {
      const [sku, url] = line.split(",");
      if (sku && url && sku !== "sku") imageMap[sku.trim()] = url.trim();
    }
    if (Object.keys(imageMap).length) {
      console.log(`  Loaded ${Object.keys(imageMap).length} real product images from CSV`);
    }
  } catch {
    // No CSV supplied — fine, fallback is used.
  }

  const productsData = ([
    // --- Cigarettes (cat 1) ---
    {
      sku: "MARLB-RED-1C", name: "Marlboro Red Label 100's Box — 1 Carton",
      description: "Philip Morris USA. Full-flavor 100mm. 10 packs × 20 cigarettes. UPC: 028200136909.",
      categoryId: 1, brandId: 1, basePrice: "89.99", wholesalePrice: "63.00",
      stockLevel: 500, isAgeRestricted: true, restrictedProductType: "tobacco",
      imageUrl: img('MARLB-RED-1C'),
    },
    {
      sku: "MARLB-GOLD-1C", name: "Marlboro Gold Pack 100's Box — 1 Carton",
      description: "Philip Morris USA. Smooth gold blend 100mm. 10 packs × 20 cigarettes. UPC: 028200146502.",
      categoryId: 1, brandId: 1, basePrice: "89.99", wholesalePrice: "63.00",
      stockLevel: 400, isAgeRestricted: true, restrictedProductType: "tobacco",
      imageUrl: img('MARLB-GOLD-1C'),
    },
    {
      sku: "CAMEL-CRUSH-1C", name: "Camel Crush King Box — 1 Carton",
      description: "R.J. Reynolds. Crushable menthol capsule, King size (85mm). 10 packs × 20. UPC: 012300197403.",
      categoryId: 1, brandId: 2, basePrice: "87.50", wholesalePrice: "80.00",
      stockLevel: 350, isAgeRestricted: true, restrictedProductType: "tobacco",
      imageUrl: img('CAMEL-CRUSH-1C'),
    },
    {
      sku: "NWPT-MNTHL-1C", name: "Newport Menthol 100s Box — 1 Carton",
      description: "R.J. Reynolds. Iconic menthol 100s. 10 packs × 20 cigarettes. UPC: 026100805734.",
      categoryId: 1, brandId: 3, basePrice: "91.50", wholesalePrice: "82.71",
      stockLevel: 600, isAgeRestricted: true, restrictedProductType: "tobacco",
      imageUrl: img('NWPT-MNTHL-1C'),
    },
    // --- Cigars & Tobacco (cat 2) ---
    {
      sku: "SWISH-RILLO-BX", name: "Swisher Sweets Cigarillos — Original 50ct Box",
      description: "Swisher International. 10 packs of 5 cigarillos. HTL wrapper, 4 3/8\" × 28½. Sweet aroma.",
      categoryId: 2, brandId: 4, basePrice: "39.99", wholesalePrice: "29.95",
      stockLevel: 200, isAgeRestricted: true, restrictedProductType: "tobacco",
      imageUrl: img('SWISH-RILLO-BX'),
    },
    {
      sku: "BLKMLD-JAZZ-BX", name: "Black & Mild Jazz Wood Tip — 25ct Box",
      description: "John Middleton Co. 5\" × 30 wood tip cigars, jazz blend. Homogenized tobacco leaf wrapper.",
      categoryId: 2, brandId: 5, basePrice: "24.99", wholesalePrice: "24.00",
      stockLevel: 300, isAgeRestricted: true, restrictedProductType: "tobacco",
      imageUrl: img('BLKMLD-JAZZ-BX'),
    },
    {
      sku: "BLKMLD-WIN-BX", name: "Black & Mild Wine Wood Tip — 25ct Box",
      description: "John Middleton Co. 5\" × 30 wine-flavored wood tip cigars. Smooth and aromatic.",
      categoryId: 2, brandId: 5, basePrice: "24.99", wholesalePrice: "26.50",
      stockLevel: 250, isAgeRestricted: true, restrictedProductType: "tobacco",
      imageUrl: img('BLKMLD-WIN-BX'),
    },
    // --- Vape & E-Liquid (cat 3) ---
    {
      sku: "GEEK-MELO-MAX", name: "Geek Bar Meloso Max — 9000 Puffs",
      description: "Geek Vape. 14mL e-liquid, 600mAh USB-C rechargeable, 5% (50mg) nicotine salt. LED indicators.",
      categoryId: 3, brandId: 8, basePrice: "17.99", wholesalePrice: "15.00",
      stockLevel: 250, isAgeRestricted: true, restrictedProductType: "nicotine_vape",
      imageUrl: img('GEEK-MELO-MAX'),
    },
    {
      sku: "GEEK-RAZ-25000", name: "RAZ TN9000 — 9000 Puffs",
      description: "Geek Vape (RAZ brand). 12mL e-liquid, 650mAh USB-C, 5% nicotine. 0.96\" HD screen display.",
      categoryId: 3, brandId: 9, basePrice: "19.99", wholesalePrice: "15.19",
      stockLevel: 180, isAgeRestricted: true, restrictedProductType: "nicotine_vape",
      imageUrl: img('GEEK-RAZ-25000'),
    },
    {
      sku: "JUICE-MNG-ICE-60ML", name: "Juice Head Mango Ice — 60mL",
      description: "Juice Head. Mango + menthol ice salt nicotine e-liquid. 60mL bottle.",
      categoryId: 3, brandId: 10, basePrice: "18.99", wholesalePrice: "14.50",
      stockLevel: 150, isAgeRestricted: true, restrictedProductType: "nicotine_vape",
      imageUrl: img('JUICE-MNG-ICE-60ML'),
    },
    {
      sku: "JUICE-WTRM-100ML", name: "Juice Head Watermelon — 100mL",
      description: "Juice Head. Sweet watermelon salt nicotine e-liquid. 100mL bottle.",
      categoryId: 3, brandId: 10, basePrice: "22.99", wholesalePrice: "17.50",
      stockLevel: 120, isAgeRestricted: true, restrictedProductType: "nicotine_vape",
      imageUrl: img('JUICE-WTRM-100ML'),
    },
    // --- Nicotine Pouches (cat 4) ---
    {
      sku: "ZYN-CLR-6MG-PCH", name: "ZYN Cool Mint 6mg — 15ct Can",
      description: "Swedish Match USA. Tobacco-free nicotine pouches. 6mg/pouch, 15 pouches per can. FDA-authorized.",
      categoryId: 4, brandId: 6, basePrice: "6.99", wholesalePrice: "3.79",
      stockLevel: 1000, isAgeRestricted: true, restrictedProductType: "nicotine_vape",
      imageUrl: img('ZYN-CLR-6MG-PCH'),
    },
    {
      sku: "ZYN-PEP-3MG-PCH", name: "ZYN Peppermint 3mg — 15ct Can",
      description: "Swedish Match USA. Tobacco-free nicotine pouches. 3mg/pouch, 15 pouches per can. FDA-authorized.",
      categoryId: 4, brandId: 6, basePrice: "6.99", wholesalePrice: "3.79",
      stockLevel: 1000, isAgeRestricted: true, restrictedProductType: "nicotine_vape",
      imageUrl: img('ZYN-PEP-3MG-PCH'),
    },
    {
      sku: "VELO-CRB-4MG-PCH", name: "VELO Citrus 4mg — 15ct Can",
      description: "R.J. Reynolds Vapor Company. Citrus flavor nicotine pouches. 4mg/pouch, 15 pouches per can.",
      categoryId: 4, brandId: 7, basePrice: "6.49", wholesalePrice: "4.00",
      stockLevel: 900, isAgeRestricted: true, restrictedProductType: "nicotine_vape",
      imageUrl: img('VELO-CRB-4MG-PCH'),
    },
    // --- Dab & Vaporizers (cat 5) ---
    {
      sku: "PUFFCO-PEAK", name: "Puffco Peak Pro 3DXL — Smart Rig",
      description: "Puffco. Bluetooth-enabled smart e-rig. ~1700mAh, USB-C + Qi wireless charging. Real-time temp control.",
      categoryId: 5, brandId: 13, basePrice: "399.99", wholesalePrice: "279.99",
      stockLevel: 25, isAgeRestricted: false, restrictedProductType: "none",
      imageUrl: img('PUFFCO-PEAK'),
    },
    {
      sku: "YOCAN-UNI", name: "Yocan UNI Pro — Universal Box Mod",
      description: "Yocan. 650mAh, variable voltage 2.0–4.2V, OLED display. Universal 510 cartridge compatibility. Type-C charging.",
      categoryId: 5, brandId: 14, basePrice: "29.99", wholesalePrice: "25.00",
      stockLevel: 140, isAgeRestricted: false, restrictedProductType: "none",
      imageUrl: img('YOCAN-UNI'),
    },
    {
      sku: "YOCAN-EVOLVE", name: "Yocan Evolve Plus XL — Wax Pen",
      description: "Yocan. 1400mAh, quad quartz coil, adjustable airflow. 115 × 22mm. Micro-USB charging.",
      categoryId: 5, brandId: 14, basePrice: "34.99", wholesalePrice: "19.99",
      stockLevel: 110, isAgeRestricted: false, restrictedProductType: "none",
      imageUrl: img('YOCAN-EVOLVE'),
    },
    // --- Grinders & Accessories (cat 6) ---
    {
      sku: "SCS-4PC-60", name: "Santa Cruz Shredder 4pc Small — 40mm",
      description: "Santa Cruz Shredder. Medical-grade anodized aluminum, 1.6\" (40mm) diameter. 4-piece with kief screen.",
      categoryId: 6, brandId: 15, basePrice: "44.99", wholesalePrice: "35.00",
      stockLevel: 90, isAgeRestricted: false, restrictedProductType: "none",
      imageUrl: img('SCS-4PC-60'),
    },
    // --- Energy & Beverages (cat 7) ---
    {
      sku: "MNSTR-ORIG-24", name: "Monster Energy Original — 24ct Case",
      description: "Monster Beverage Corp. 16 fl oz cans, 160mg caffeine per can. 24 cans per case.",
      categoryId: 7, brandId: 16, basePrice: "41.99", wholesalePrice: "33.00",
      stockLevel: 180, isAgeRestricted: false, restrictedProductType: "none",
      imageUrl: img('MNSTR-ORIG-24'),
    },
    {
      sku: "RDBLL-SF-12", name: "Red Bull Sugarfree — 12ct Case",
      description: "Red Bull GmbH. 8.4 fl oz cans, 80mg caffeine, sugar-free. 12 cans per case.",
      categoryId: 7, brandId: 17, basePrice: "26.99", wholesalePrice: "20.00",
      stockLevel: 200, isAgeRestricted: false, restrictedProductType: "none",
      imageUrl: img('RDBLL-SF-12'),
    },
    // --- Smoking Accessories (cat 8) ---
    {
      sku: "RAW-CN-1.25-100", name: "RAW Classic Pre-Rolled Cones 1 1/4",
      description: "RAW (HBI International). 83mm + 26mm tip, unbleached natural cones. Holds ~0.75g each. 6 cones/pack.",
      categoryId: 8, brandId: 11, basePrice: "3.99", wholesalePrice: "1.50",
      stockLevel: 800, isAgeRestricted: false, restrictedProductType: "smoking_accessory",
      imageUrl: img('RAW-CN-1.25-100'),
    },
    {
      sku: "ZIPPO-BLK-MTL", name: "Zippo Black Matte Lighter (Model 218)",
      description: "Zippo Manufacturing Co. Windproof, refillable, all-metal construction. Model 218, UPC: 041689102708.",
      categoryId: 8, brandId: 12, basePrice: "24.99", wholesalePrice: "20.00",
      stockLevel: 120, isAgeRestricted: false, restrictedProductType: "none",
      imageUrl: img('ZIPPO-BLK-MTL'),
    },
  ] as Array<{
    sku: string;
    name: string;
    description: string;
    categoryId: number;
    brandId: number | null;
    basePrice: string;
    wholesalePrice: string;
    stockLevel: number;
    isAgeRestricted: boolean;
    restrictedProductType: string;
    imageUrl: string | null;
  }>).map((p) => ({ ...p, imageUrl: imageMap[p.sku] ?? p.imageUrl ?? null }));

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
