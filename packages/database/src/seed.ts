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
  // Owner login works out of the box. The seeded admin gets a real password so
  // the credentials provider can authenticate (authorize() rejects null hashes).
  // Change this password after first sign-in.
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
    { name: "Glass & Pipes", slug: "glass-pipes", displayOrder: 5 },
    { name: "Dab & Vaporizers", slug: "vaporizers", displayOrder: 6 },
    { name: "Grinders & Torches", slug: "grinders-torches", displayOrder: 7 },
    { name: "Novelties", slug: "novelties", displayOrder: 8 },
    { name: "Clothing & Beauty", slug: "clothing-beauty", displayOrder: 9 },
    { name: "Energy & Beverages", slug: "beverages", displayOrder: 10 },
    { name: "Snacks & Candy", slug: "candy-snacks", displayOrder: 11 },
    { name: "Electronics", slug: "electronics", displayOrder: 12 },
    { name: "Refurbished Electronics", slug: "refurbished", displayOrder: 13 },
    { name: "Convenience & General", slug: "general", displayOrder: 14 },
    { name: "Smoking Accessories", slug: "accessories", displayOrder: 15 },
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
    { name: "Juice Head", slug: "juice-head" },
    { name: "RAW", slug: "raw" },
    { name: "Zippo", slug: "zippo" },
    { name: "Roor", slug: "roor" },
    { name: "Grav", slug: "grav" },
    { name: "Puffco", slug: "puffco" },
    { name: "Yocan", slug: "yocan" },
    { name: "Calibear", slug: "calibear" },
    { name: "Santa Cruz Shredder", slug: "santa-cruz-shredder" },
    { name: "Blazer", slug: "blazer" },
    { name: "Triple Flame", slug: "triple-flame" },
    { name: "Monster", slug: "monster" },
    { name: "Red Bull", slug: "red-bull" },
    { name: "Coca-Cola", slug: "coca-cola" },
    { name: "Doritos", slug: "doritos" },
    { name: "Reese's", slug: "reeses" },
    { name: "Hot Topic", slug: "hot-topic" },
    { name: "NYX", slug: "nyx" },
    { name: "GoPro", slug: "gopro" },
    { name: "JBL", slug: "jbl" },
    { name: "Refurb Auction", slug: "refurb-auction" },
  ];

  for (const brand of brandData) {
    await db
      .insert(schema.brands)
      .values({ tenantId, ...brand, isActive: true })
      .onConflictDoNothing();
  }
  console.log(`  Created ${brandData.length} brands`);

  // Real product photos are supplied by the operator via product-images.csv
  // (sku,imageUrl) or local files in apps/web/public/products/{sku}.{ext}.
  // Until then, imageUrl stays null and the UI shows a clean emoji placeholder
  // (never a misleading generic stock photo).
  const img = () => null;

  // Optional operator-supplied image map: packages/database/product-images.csv
  // with header `sku,imageUrl`. Merged into productsData before insert.
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
    // No CSV supplied — fine, emoji fallback is used.
  }

  const productsData = ([

    // --- Cigarettes (1) ---
    {
      sku: "MARLB-RED-1C", name: "Marlboro Red 100s — 1 Carton",
      description: "Full-flavor king size 100s. 10 packs per carton.",
      categoryId: 1, brandId: 1, basePrice: "89.99", wholesalePrice: "82.50",
      stockLevel: 500, isAgeRestricted: true, restrictedProductType: "tobacco",
      imageUrl: img(),
    },
    {
      sku: "MARLB-GOLD-1C", name: "Marlboro Gold 100s — 1 Carton",
      description: "Smooth premium taste. 10 packs per carton.",
      categoryId: 1, brandId: 1, basePrice: "89.99", wholesalePrice: "82.50",
      stockLevel: 400, isAgeRestricted: true, restrictedProductType: "tobacco",
      imageUrl: img(),
    },
    {
      sku: "CAMEL-CRUSH-1C", name: "Camel Crush 100s — 1 Carton",
      description: "Menthol capsule crushable for custom freshness.",
      categoryId: 1, brandId: 2, basePrice: "87.50", wholesalePrice: "80.00",
      stockLevel: 350, isAgeRestricted: true, restrictedProductType: "tobacco",
      imageUrl: img(),
    },
    {
      sku: "NWPT-MNTHL-1C", name: "Newport Menthol 100s — 1 Carton",
      description: "Iconic menthol smoothness. 10 packs per carton.",
      categoryId: 1, brandId: 3, basePrice: "91.50", wholesalePrice: "84.00",
      stockLevel: 600, isAgeRestricted: true, restrictedProductType: "tobacco",
      imageUrl: img(),
    },
    // --- Cigars & Tobacco (2) ---
    {
      sku: "SWISH-RILLO-BX", name: "Swisher Sweets Rillo — 50ct Box",
      description: "Original cigarillo. Sweet aroma, smooth draw.",
      categoryId: 2, brandId: 4, basePrice: "39.99", wholesalePrice: "35.00",
      stockLevel: 200, isAgeRestricted: true, restrictedProductType: "tobacco",
      imageUrl: img(),
    },
    {
      sku: "BLKMLD-JAZZ-BX", name: "Black & Mild Jazz — 25ct Box",
      description: "Wood tip cigar with jazz blend.",
      categoryId: 2, brandId: 5, basePrice: "24.99", wholesalePrice: "21.50",
      stockLevel: 300, isAgeRestricted: true, restrictedProductType: "tobacco",
      imageUrl: img(),
    },
    {
      sku: "BLKMLD-WIN-BX", name: "Black & Mild Wine — 25ct Box",
      description: "Wine-flavored tip cigar, smooth and aromatic.",
      categoryId: 2, brandId: 5, basePrice: "24.99", wholesalePrice: "21.50",
      stockLevel: 250, isAgeRestricted: true, restrictedProductType: "tobacco",
      imageUrl: img(),
    },
    // --- Vape & E-Liquid (3) ---
    {
      sku: "GEEK-MELO-MAX", name: "Geek Bar Meloso Max — 3000 Puffs",
      description: "Disposable vape. 5% nicotine. Rechargeable.",
      categoryId: 3, brandId: 8, basePrice: "14.99", wholesalePrice: "11.00",
      stockLevel: 250, isAgeRestricted: true, restrictedProductType: "nicotine_vape",
      imageUrl: img(),
    },
    {
      sku: "GEEK-RAZ-25000", name: "Geek Bar Raz — 25000 Puffs",
      description: "High-capacity disposable. Smart screen, 5% nicotine.",
      categoryId: 3, brandId: 8, basePrice: "22.99", wholesalePrice: "17.00",
      stockLevel: 180, isAgeRestricted: true, restrictedProductType: "nicotine_vape",
      imageUrl: img(),
    },
    {
      sku: "JUICE-MNG-ICE-60ML", name: "Juice Head Mango Ice — 60mL",
      description: "Mango + menthol ice salt nicotine e-liquid.",
      categoryId: 3, brandId: 9, basePrice: "18.99", wholesalePrice: "14.50",
      stockLevel: 150, isAgeRestricted: true, restrictedProductType: "nicotine_vape",
      imageUrl: img(),
    },
    {
      sku: "JUICE-WTRM-100ML", name: "Juice Head Watermelon — 100mL",
      description: "Sweet watermelon salt nic e-liquid.",
      categoryId: 3, brandId: 9, basePrice: "22.99", wholesalePrice: "17.50",
      stockLevel: 120, isAgeRestricted: true, restrictedProductType: "nicotine_vape",
      imageUrl: img(),
    },
    // --- Nicotine Pouches (4) ---
    {
      sku: "ZYN-CLR-6MG-PCH", name: "ZYN Cooler 6mg — 15ct Pouch",
      description: "Smooth nicotine pouch. No tobacco leaf.",
      categoryId: 4, brandId: 6, basePrice: "6.99", wholesalePrice: "5.25",
      stockLevel: 1000, isAgeRestricted: true, restrictedProductType: "nicotine_vape",
      imageUrl: img(),
    },
    {
      sku: "ZYN-PEP-3MG-PCH", name: "ZYN Peppermint 3mg — 15ct Pouch",
      description: "Refreshing peppermint nicotine pouch.",
      categoryId: 4, brandId: 6, basePrice: "6.99", wholesalePrice: "5.25",
      stockLevel: 1000, isAgeRestricted: true, restrictedProductType: "nicotine_vape",
      imageUrl: img(),
    },
    {
      sku: "VELO-CRB-4MG-PCH", name: "VELO Citrus 4mg — 15ct Pouch",
      description: "Bright citrus nicotine pouch.",
      categoryId: 4, brandId: 7, basePrice: "6.49", wholesalePrice: "4.95",
      stockLevel: 900, isAgeRestricted: true, restrictedProductType: "nicotine_vape",
      imageUrl: img(),
    },
    // --- Glass & Pipes (5) ---
    {
      sku: "ROOR-STRAIGHT-14", name: "Roor Straight Tube — 14\"",
      description: "German borosilicate straight tube, 14mm joint.",
      categoryId: 5, brandId: 12, basePrice: "189.99", wholesalePrice: "149.00",
      stockLevel: 40, isAgeRestricted: false, restrictedProductType: "none",
      imageUrl: img(),
    },
    {
      sku: "GRAV-STRAIGHT-12", name: "Grav Straight Tube — 12\"",
      description: "American made straight tube with ice catches.",
      categoryId: 5, brandId: 13, basePrice: "99.99", wholesalePrice: "74.00",
      stockLevel: 60, isAgeRestricted: false, restrictedProductType: "none",
      imageUrl: img(),
    },
    {
      sku: "GRAV-OILBURNER", name: "Grav Oil Burner Pipe",
      description: "Classic oil burner glass pipe, thick wall.",
      categoryId: 5, brandId: 13, basePrice: "12.99", wholesalePrice: "8.50",
      stockLevel: 300, isAgeRestricted: false, restrictedProductType: "none",
      imageUrl: img(),
    },
    {
      sku: "CALIBEAR-BEAKER", name: "Calibear Beaker Bong — 12\"",
      description: "Beaker base water pipe with percolator.",
      categoryId: 5, brandId: 16, basePrice: "79.99", wholesalePrice: "58.00",
      stockLevel: 70, isAgeRestricted: false, restrictedProductType: "none",
      imageUrl: img(),
    },
    {
      sku: "ROOR-BUBBLER", name: "Roor Mini Bubbler",
      description: "Compact bubbler for smooth hits on the go.",
      categoryId: 5, brandId: 12, basePrice: "129.99", wholesalePrice: "99.00",
      stockLevel: 35, isAgeRestricted: false, restrictedProductType: "none",
      imageUrl: img(),
    },
    // --- Dab & Vaporizers (6) ---
    {
      sku: "PUFFCO-PEAK", name: "Puffco Peak Pro Vaporizer",
      description: "Smart rig for concentrates. App-controlled heat.",
      categoryId: 6, brandId: 14, basePrice: "399.99", wholesalePrice: "320.00",
      stockLevel: 25, isAgeRestricted: false, restrictedProductType: "none",
      imageUrl: img(),
    },
    {
      sku: "YOCAN-UNI", name: "Yocan UNI Pro Box Mod",
      description: "Variable voltage cartridge vaporizer with OLED.",
      categoryId: 6, brandId: 15, basePrice: "29.99", wholesalePrice: "21.00",
      stockLevel: 140, isAgeRestricted: false, restrictedProductType: "none",
      imageUrl: img(),
    },
    {
      sku: "YOCAN-EVOLVE", name: "Yocan Evolve Plus XL Dab Pen",
      description: "Quad-coil wax pen with built-in storage.",
      categoryId: 6, brandId: 15, basePrice: "34.99", wholesalePrice: "25.00",
      stockLevel: 110, isAgeRestricted: false, restrictedProductType: "none",
      imageUrl: img(),
    },
    {
      sku: "CALIBEAR-E-NAIL", name: "Calibear E-Nail Kit",
      description: "Electronic nail for consistent dab temps.",
      categoryId: 6, brandId: 16, basePrice: "119.99", wholesalePrice: "89.00",
      stockLevel: 30, isAgeRestricted: false, restrictedProductType: "none",
      imageUrl: img(),
    },
    // --- Grinders & Torches (7) ---
    {
      sku: "SCS-4PC-60", name: "Santa Cruz Shredder 4pc — 60mm",
      description: "Aircraft-grade aluminum herb grinder, 60mm.",
      categoryId: 7, brandId: 17, basePrice: "44.99", wholesalePrice: "33.00",
      stockLevel: 90, isAgeRestricted: false, restrictedProductType: "none",
      imageUrl: img(),
    },
    {
      sku: "SCS-2PC-50", name: "Santa Cruz Shredder 2pc — 50mm",
      description: "Compact travel grinder, medical-grade.",
      categoryId: 7, brandId: 17, basePrice: "29.99", wholesalePrice: "22.00",
      stockLevel: 120, isAgeRestricted: false, restrictedProductType: "none",
      imageUrl: img(),
    },
    {
      sku: "BLAZER-GB200", name: "Blazer Big Shot GT8000 Torch",
      description: "Refillable butane torch, adjustable flame.",
      categoryId: 7, brandId: 18, basePrice: "59.99", wholesalePrice: "44.00",
      stockLevel: 80, isAgeRestricted: false, restrictedProductType: "none",
      imageUrl: img(),
    },
    {
      sku: "TRIPLEFLM-TORCH", name: "Triple Flame Torch Lighter",
      description: "Wind-resistant triple jet flame torch.",
      categoryId: 7, brandId: 19, basePrice: "19.99", wholesalePrice: "14.00",
      stockLevel: 200, isAgeRestricted: false, restrictedProductType: "none",
      imageUrl: img(),
    },
    {
      sku: "BUTANE-12CT", name: "Premium Butane Fuel — 12ct Case",
      description: "5x refined butane for lighters and torches.",
      categoryId: 7, brandId: null, basePrice: "36.99", wholesalePrice: "27.00",
      stockLevel: 150, isAgeRestricted: false, restrictedProductType: "none",
      imageUrl: img(),
    },
    // --- Novelties (8) ---
    {
      sku: "NOV-GLOW-JAR", name: "UV Glow Novelty Jar",
      description: "Blacklight-reactive novelty storage jar.",
      categoryId: 8, brandId: null, basePrice: "9.99", wholesalePrice: "6.50",
      stockLevel: 220, isAgeRestricted: false, restrictedProductType: "none",
      imageUrl: img(),
    },
    {
      sku: "NOV-PLUSH", name: "Novelty Plush Keychain 12ct",
      description: "Assorted countertop novelty keychains.",
      categoryId: 8, brandId: null, basePrice: "23.99", wholesalePrice: "16.00",
      stockLevel: 130, isAgeRestricted: false, restrictedProductType: "none",
      imageUrl: img(),
    },
    {
      sku: "NOV-PUZZLE", name: "3D Puzzle Box 24ct Display",
      description: "Brain-teaser novelty display box.",
      categoryId: 8, brandId: null, basePrice: "31.99", wholesalePrice: "22.00",
      stockLevel: 90, isAgeRestricted: false, restrictedProductType: "none",
      imageUrl: img(),
    },
    // --- Clothing & Beauty (9) ---
    {
      sku: "CLTH-TCKT-TEE", name: "Hot Topic Graphic Tee",
      description: "Assorted counter-culture graphic tees, S–3XL.",
      categoryId: 9, brandId: 25, basePrice: "14.99", wholesalePrice: "9.00",
      stockLevel: 160, isAgeRestricted: false, restrictedProductType: "none",
      imageUrl: img(),
    },
    {
      sku: "CLTH-HOODIE", name: "Pullover Hoodie — Unisex",
      description: "Heavyweight fleece hoodie, assorted colors.",
      categoryId: 9, brandId: 25, basePrice: "24.99", wholesalePrice: "16.00",
      stockLevel: 110, isAgeRestricted: false, restrictedProductType: "none",
      imageUrl: img(),
    },
    {
      sku: "BEAUTY-NYX-LIP", name: "NYX Soft Matte Lip Cream",
      description: "Popular matte liquid lipstick, assorted shades.",
      categoryId: 9, brandId: 26, basePrice: "8.99", wholesalePrice: "5.50",
      stockLevel: 240, isAgeRestricted: false, restrictedProductType: "none",
      imageUrl: img(),
    },
    {
      sku: "BEAUTY-SLEEP", name: "Sleep Aid — 60ct (Diphenhydramine)",
      description: "Nighttime sleep aid tablets, 25mg.",
      categoryId: 9, brandId: null, basePrice: "11.99", wholesalePrice: "7.50",
      stockLevel: 200, isAgeRestricted: false, restrictedProductType: "none",
      imageUrl: img(),
    },
    // --- Energy & Beverages (10) ---
    {
      sku: "MNSTR-ORIG-24", name: "Monster Energy Original — 24ct",
      description: "16oz original green, full case.",
      categoryId: 10, brandId: 20, basePrice: "41.99", wholesalePrice: "31.00",
      stockLevel: 180, isAgeRestricted: false, restrictedProductType: "none",
      imageUrl: img(),
    },
    {
      sku: "RDBLL-SF-12", name: "Red Bull Sugarfree — 12ct",
      description: "8.4oz sugarfree energy, 12-pack.",
      categoryId: 10, brandId: 21, basePrice: "26.99", wholesalePrice: "19.50",
      stockLevel: 200, isAgeRestricted: false, restrictedProductType: "none",
      imageUrl: img(),
    },
    {
      sku: "COKE-12OZ-24", name: "Coca-Cola Original — 24ct",
      description: "12oz cans, classic cola.",
      categoryId: 10, brandId: 22, basePrice: "19.99", wholesalePrice: "14.00",
      stockLevel: 260, isAgeRestricted: false, restrictedProductType: "none",
      imageUrl: img(),
    },
    // --- Snacks & Candy (11) ---
    {
      sku: "DORITOS-CRN-40", name: "Doritos Cool Ranch — 40ct Box",
      description: "Single-serve bags, countertop box.",
      categoryId: 11, brandId: 23, basePrice: "34.99", wholesalePrice: "25.00",
      stockLevel: 140, isAgeRestricted: false, restrictedProductType: "none",
      imageUrl: img(),
    },
    {
      sku: "REESE-CUP-36", name: "Reese's Peanut Butter Cups — 36ct",
      description: "King size singles, counter display.",
      categoryId: 11, brandId: 24, basePrice: "29.99", wholesalePrice: "21.00",
      stockLevel: 160, isAgeRestricted: false, restrictedProductType: "none",
      imageUrl: img(),
    },
    {
      sku: "CANDY-AST-50", name: "Assorted Novelty Candy — 50ct",
      description: "Mixed novelty candies, grab-and-go peg bag.",
      categoryId: 11, brandId: null, basePrice: "27.99", wholesalePrice: "19.00",
      stockLevel: 120, isAgeRestricted: false, restrictedProductType: "none",
      imageUrl: img(),
    },
    // --- Electronics (12) ---
    {
      sku: "CAM-GOPRO-HERO", name: "GoPro HERO Action Camera",
      description: "4K action camera, waterproof housing.",
      categoryId: 12, brandId: 27, basePrice: "299.99", wholesalePrice: "240.00",
      stockLevel: 30, isAgeRestricted: false, restrictedProductType: "none",
      imageUrl: img(),
    },
    {
      sku: "SPKR-JBL-FLIP", name: "JBL Flip Portable Speaker",
      description: "Waterproof bluetooth speaker, 12hr battery.",
      categoryId: 12, brandId: 28, basePrice: "99.99", wholesalePrice: "74.00",
      stockLevel: 70, isAgeRestricted: false, restrictedProductType: "none",
      imageUrl: img(),
    },
    // --- Refurbished Electronics (13) ---
    {
      sku: "REFURB-ECHO-10", name: "Refurbished Smart Speaker — 10\"",
      description: "Auction-grade refurb, tested & wiped.",
      categoryId: 13, brandId: 29, basePrice: "39.99", wholesalePrice: "28.00",
      stockLevel: 45, isAgeRestricted: false, restrictedProductType: "none",
      imageUrl: img(),
    },
    {
      sku: "REFURB-TAB-10", name: "Refurbished 10\" Tablet",
      description: "Auction lot tablet, factory reset, cosmetic grade B.",
      categoryId: 13, brandId: 29, basePrice: "59.99", wholesalePrice: "42.00",
      stockLevel: 38, isAgeRestricted: false, restrictedProductType: "none",
      imageUrl: img(),
    },
    {
      sku: "REFURB-BT-HP", name: "Refurbished Bluetooth Headphones",
      description: "Auction-grade over-ear headphones, tested.",
      categoryId: 13, brandId: 29, basePrice: "24.99", wholesalePrice: "17.00",
      stockLevel: 60, isAgeRestricted: false, restrictedProductType: "none",
      imageUrl: img(),
    },
    // --- Convenience & General (14) ---
    {
      sku: "GEN-LTGAS-12", name: "Mini Lighter Gas — 12ct",
      description: "Pocket flint lighters, display card.",
      categoryId: 14, brandId: null, basePrice: "9.99", wholesalePrice: "6.50",
      stockLevel: 300, isAgeRestricted: false, restrictedProductType: "none",
      imageUrl: img(),
    },
    {
      sku: "GEN-TISSUE-24", name: "Pocket Tissues — 24ct",
      description: "Single-pack facial tissues, counter display.",
      categoryId: 14, brandId: null, basePrice: "14.99", wholesalePrice: "10.00",
      stockLevel: 220, isAgeRestricted: false, restrictedProductType: "none",
      imageUrl: img(),
    },
    // --- Smoking Accessories (15) ---
    {
      sku: "RAW-CN-1.25-100", name: "RAW Classic Cones 1.25\" — 100ct",
      description: "Unrefined natural rolling cones.",
      categoryId: 15, brandId: 10, basePrice: "3.99", wholesalePrice: "2.75",
      stockLevel: 800, isAgeRestricted: false, restrictedProductType: "smoking_accessory",
      imageUrl: img(),
    },
    {
      sku: "ZIPPO-BLK-MTL", name: "Zippo Black Matte Lighter",
      description: "Classic Zippo windproof lighter. Refillable.",
      categoryId: 15, brandId: 11, basePrice: "24.99", wholesalePrice: "19.00",
      stockLevel: 120, isAgeRestricted: false, restrictedProductType: "none",
      imageUrl: img(),
    },
    {
      sku: "RAW-TRAY-MED", name: "RAW Medium Rolling Tray",
      description: "Magnetic snap closure rolling tray.",
      categoryId: 15, brandId: 10, basePrice: "12.99", wholesalePrice: "8.50",
      stockLevel: 180, isAgeRestricted: false, restrictedProductType: "smoking_accessory",
      imageUrl: img(),
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
