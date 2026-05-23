/**
 * schema.ts — Drizzle ORM schema (MySQL)
 *
 * Senior-level improvements:
 * - Composite indexes for common query patterns (prevents full-table scans)
 * - cartItems.updatedAt for optimistic concurrency
 * - orders.status enum (pending → paid → fulfilled → cancelled)
 * - priceAtAddition stored on cartItems (immutable snapshot, critical for billing)
 * - quoteRequests.notes field added
 * - ageVerifications.verificationReference for third-party audit trail
 * - All soft-deletable tables have deletedAt
 * - NEVER store raw payment data — only tokenized references (Stripe paymentIntentId)
 */

import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable(
  "users",
  {
    id: int("id").autoincrement().primaryKey(),
    openId: varchar("openId", { length: 64 }).notNull().unique(),
    name: text("name"),
    email: varchar("email", { length: 320 }),
    loginMethod: varchar("loginMethod", { length: 64 }),
    role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
    isWholesaleAccount: boolean("isWholesaleAccount").default(false),
    // Soft delete — never hard-delete user records (order history integrity)
    deletedAt: timestamp("deletedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
  })
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Categories ───────────────────────────────────────────────────────────────
export const categories = mysqlTable(
  "categories",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    description: text("description"),
    parentId: int("parentId"),
    imageUrl: text("imageUrl"),
    displayOrder: int("displayOrder").default(0),
    isActive: boolean("isActive").default(true),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    parentIdx: index("categories_parent_idx").on(table.parentId),
    displayOrderIdx: index("categories_display_order_idx").on(table.displayOrder),
  })
);

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

// ─── Brands ───────────────────────────────────────────────────────────────────
export const brands = mysqlTable("brands", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  logoUrl: text("logoUrl"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Brand = typeof brands.$inferSelect;
export type InsertBrand = typeof brands.$inferInsert;

// ─── Products ─────────────────────────────────────────────────────────────────
export const products = mysqlTable(
  "products",
  {
    id: int("id").autoincrement().primaryKey(),
    sku: varchar("sku", { length: 100 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    categoryId: int("categoryId").notNull(),
    brandId: int("brandId"),
    imageUrl: text("imageUrl"),
    imageUrls: json("imageUrls").$type<string[]>(),
    basePrice: decimal("basePrice", { precision: 10, scale: 2 }).notNull(),
    stockLevel: int("stockLevel").default(0),
    isAgeRestricted: boolean("isAgeRestricted").default(false),
    restrictedProductType: mysqlEnum("restrictedProductType", [
      "tobacco",
      "thca_flower",
      "thca_concentrate",
      "delta8",
      "delta9",
      "nicotine_vape",
      "thca_vape",
      "delta8_vape",
      "delta9_vape",
      "smoking_accessory_restricted",
      "none",
    ]).default("none"),
    isActive: boolean("isActive").default(true),
    // Soft delete support
    deletedAt: timestamp("deletedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    // Composite index for category browse + sort by price
    categoryPriceIdx: index("products_category_price_idx").on(table.categoryId, table.basePrice),
    brandIdx: index("products_brand_idx").on(table.brandId),
    isActiveIdx: index("products_active_idx").on(table.isActive),
    // Full-text search index — requires MySQL 5.6+
    // nameDescFt: fulltext("products_name_desc_ft").on(table.name, table.description),
  })
);

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ─── Bulk Pricing Tiers ───────────────────────────────────────────────────────
export const bulkPricingTiers = mysqlTable(
  "bulkPricingTiers",
  {
    id: int("id").autoincrement().primaryKey(),
    productId: int("productId").notNull(),
    minQuantity: int("minQuantity").notNull(),
    maxQuantity: int("maxQuantity"), // NULL = unlimited
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    productQuantityIdx: index("bulk_pricing_product_qty_idx").on(
      table.productId,
      table.minQuantity
    ),
  })
);

export type BulkPricingTier = typeof bulkPricingTiers.$inferSelect;
export type InsertBulkPricingTier = typeof bulkPricingTiers.$inferInsert;

// ─── Cart Items ───────────────────────────────────────────────────────────────
/**
 * IMPORTANT: priceAtAddition stores the price at the time the item was added.
 * This prevents race conditions where a price change between add-to-cart and
 * checkout results in billing the wrong amount.
 * The checkout flow MUST use server-recalculated prices, not this snapshot,
 * but this snapshot is useful for displaying "price when added" context to users.
 */
export const cartItems = mysqlTable(
  "cartItems",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    productId: int("productId").notNull(),
    quantity: int("quantity").notNull().default(1),
    priceAtAddition: decimal("priceAtAddition", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    // Unique: one row per user+product (merge duplicates)
    userProductUnique: uniqueIndex("cart_user_product_unique").on(table.userId, table.productId),
    userIdx: index("cart_user_idx").on(table.userId),
  })
);

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = typeof cartItems.$inferInsert;

// ─── Orders ───────────────────────────────────────────────────────────────────
export const orders = mysqlTable(
  "orders",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    /**
     * Status machine:
     * pending_payment → paid → processing → fulfilled → refunded | cancelled
     * Never skip states. Use a background job to enforce transitions.
     */
    status: mysqlEnum("status", [
      "pending_payment",
      "paid",
      "processing",
      "fulfilled",
      "refunded",
      "cancelled",
    ])
      .default("pending_payment")
      .notNull(),
    totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
    shippingAddress: json("shippingAddress").notNull(),
    /** Stripe PaymentIntent ID — NEVER store raw card data */
    paymentIntentId: varchar("paymentIntentId", { length: 255 }),
    paymentMethod: varchar("paymentMethod", { length: 64 }),
    /** For net-30 accounts */
    invoiceDueDate: timestamp("invoiceDueDate"),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userStatusIdx: index("orders_user_status_idx").on(table.userId, table.status),
    paymentIntentIdx: index("orders_payment_intent_idx").on(table.paymentIntentId),
  })
);

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// ─── Order Items ──────────────────────────────────────────────────────────────
export const orderItems = mysqlTable(
  "orderItems",
  {
    id: int("id").autoincrement().primaryKey(),
    orderId: int("orderId").notNull(),
    productId: int("productId").notNull(),
    quantity: int("quantity").notNull(),
    /** Immutable price snapshot at time of purchase */
    pricePerUnit: decimal("pricePerUnit", { precision: 10, scale: 2 }).notNull(),
    /** Computed: quantity * pricePerUnit (stored for query efficiency) */
    lineTotal: decimal("lineTotal", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    orderIdx: index("order_items_order_idx").on(table.orderId),
    productIdx: index("order_items_product_idx").on(table.productId),
  })
);

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

// ─── Age Verifications ────────────────────────────────────────────────────────
export const ageVerifications = mysqlTable(
  "ageVerifications",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    method: varchar("method", { length: 100 }).notNull(),
    verificationStatus: mysqlEnum("verificationStatus", [
      "pending",
      "approved",
      "rejected",
      "expired",
    ]).notNull(),
    /**
     * External reference from verification provider (AgeChecker.net, Persona, etc.)
     * Used for audit trail and dispute resolution.
     */
    verificationReference: varchar("verificationReference", { length: 255 }),
    verificationData: json("verificationData"),
    expiresAt: timestamp("expiresAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userStatusIdx: index("age_verif_user_status_idx").on(
      table.userId,
      table.verificationStatus,
      table.createdAt
    ),
  })
);

export type AgeVerification = typeof ageVerifications.$inferSelect;
export type InsertAgeVerification = typeof ageVerifications.$inferInsert;

// ─── Quote Requests ───────────────────────────────────────────────────────────
export const quoteRequests = mysqlTable(
  "quoteRequests",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    productIds: json("productIds").$type<number[]>().notNull(),
    quantities: json("quantities").$type<number[]>().notNull(),
    estimatedTotal: decimal("estimatedTotal", { precision: 12, scale: 2 }),
    notes: text("notes"),
    status: mysqlEnum("status", ["submitted", "reviewing", "quoted", "accepted", "rejected"])
      .default("submitted")
      .notNull(),
    adminNotes: text("adminNotes"),
    quotedTotal: decimal("quotedTotal", { precision: 12, scale: 2 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userStatusIdx: index("quote_user_status_idx").on(table.userId, table.status),
  })
);

export type QuoteRequest = typeof quoteRequests.$inferSelect;
export type InsertQuoteRequest = typeof quoteRequests.$inferInsert;
