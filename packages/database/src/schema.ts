import {
  pgTable,
  serial,
  varchar,
  text,
  numeric,
  integer,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  domain: varchar("domain", { length: 255 }),
  config: jsonb("config").$type<TenantConfig>().default({}).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;

export interface TenantConfig {
  taxRate?: number;
  shippingFreeThreshold?: number;
  currency?: string;
  timezone?: string;
}

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: text("name"),
  emailVerified: timestamp("email_verified"),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const tenantUsers = pgTable(
  "tenant_users",
  {
    id: serial("id").primaryKey(),
    tenantId: integer("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 50 }).notNull().default("user"),
    isWholesale: boolean("is_wholesale").default(false).notNull(),
    tobaccoLicense: text("tobacco_license"),
    licenseVerifiedAt: timestamp("license_verified_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantUserUnique: uniqueIndex("tenant_user_unique").on(
      table.tenantId,
      table.userId
    ),
  })
);

export type TenantUser = typeof tenantUsers.$inferSelect;
export type InsertTenantUser = typeof tenantUsers.$inferInsert;

export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    tenantId: integer("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    description: text("description"),
    parentId: integer("parent_id"),
    imageUrl: text("image_url"),
    displayOrder: integer("display_order").default(0),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantSlugUnique: uniqueIndex("categories_tenant_slug_unique").on(
      table.tenantId,
      table.slug
    ),
    parentIdx: index("categories_parent_idx").on(table.parentId),
  })
);

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

export const brands = pgTable(
  "brands",
  {
    id: serial("id").primaryKey(),
    tenantId: integer("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    logoUrl: text("logo_url"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantNameUnique: uniqueIndex("brands_tenant_name_unique").on(
      table.tenantId,
      table.name
    ),
  })
);

export type Brand = typeof brands.$inferSelect;
export type InsertBrand = typeof brands.$inferInsert;

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    tenantId: integer("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    sku: varchar("sku", { length: 100 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    categoryId: integer("category_id").references(() => categories.id),
    brandId: integer("brand_id").references(() => brands.id),
    imageUrl: text("image_url"),
    imageUrls: jsonb("image_urls").$type<string[]>(),
    basePrice: numeric("base_price", { precision: 10, scale: 2 }).notNull(),
    wholesalePrice: numeric("wholesale_price", { precision: 10, scale: 2 }),
    stockLevel: integer("stock_level").default(0).notNull(),
    isAgeRestricted: boolean("is_age_restricted").default(false).notNull(),
    restrictedProductType: varchar("restricted_product_type", {
      length: 50,
    }).default("none"),
    isActive: boolean("is_active").default(true).notNull(),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantSkuUnique: uniqueIndex("products_tenant_sku_unique").on(
      table.tenantId,
      table.sku
    ),
    categoryPriceIdx: index("products_category_price_idx").on(
      table.categoryId,
      table.basePrice
    ),
    tenantActiveIdx: index("products_tenant_active_idx").on(
      table.tenantId,
      table.isActive
    ),
  })
);

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

export const bulkPricingTiers = pgTable(
  "bulk_pricing_tiers",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    minQuantity: integer("min_quantity").notNull(),
    maxQuantity: integer("max_quantity"),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
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

export const cartItems = pgTable(
  "cart_items",
  {
    id: serial("id").primaryKey(),
    tenantId: integer("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    priceAtAddition: numeric("price_at_addition", {
      precision: 10,
      scale: 2,
    }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userProductUnique: uniqueIndex("cart_user_product_unique").on(
      table.tenantId,
      table.userId,
      table.productId
    ),
    userIdx: index("cart_user_idx").on(table.userId),
  })
);

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = typeof cartItems.$inferInsert;

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    tenantId: integer("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 50 })
      .notNull()
      .default("pending_payment"),
    type: varchar("type", { length: 20 }).notNull().default("retail"),
    totalAmount: numeric("total_amount", {
      precision: 12,
      scale: 2,
    }).notNull(),
    shippingAddress: jsonb("shipping_address").$type<ShippingAddress>(),
    paymentIntentId: varchar("payment_intent_id", { length: 255 }),
    paymentMethod: varchar("payment_method", { length: 64 }),
    invoiceDueDate: timestamp("invoice_due_date"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantStatusIdx: index("orders_tenant_status_idx").on(
      table.tenantId,
      table.status
    ),
    userIdx: index("orders_user_idx").on(table.userId),
  })
);

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

export interface ShippingAddress {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id),
    quantity: integer("quantity").notNull(),
    pricePerUnit: numeric("price_per_unit", {
      precision: 10,
      scale: 2,
    }).notNull(),
    lineTotal: numeric("line_total", {
      precision: 12,
      scale: 2,
    }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orderIdx: index("order_items_order_idx").on(table.orderId),
  })
);

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

export const ageVerifications = pgTable(
  "age_verifications",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    method: varchar("method", { length: 100 }).notNull(),
    verificationStatus: varchar("verification_status", { length: 50 })
      .notNull()
      .default("pending"),
    verificationReference: varchar("verification_reference", { length: 255 }),
    verificationData: jsonb("verification_data"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userStatusIdx: index("age_verif_user_status_idx").on(
      table.userId,
      table.verificationStatus
    ),
  })
);

export type AgeVerification = typeof ageVerifications.$inferSelect;
export type InsertAgeVerification = typeof ageVerifications.$inferInsert;

export const quoteRequests = pgTable(
  "quote_requests",
  {
    id: serial("id").primaryKey(),
    tenantId: integer("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productIds: jsonb("product_ids").$type<number[]>().notNull(),
    quantities: jsonb("quantities").$type<number[]>().notNull(),
    estimatedTotal: numeric("estimated_total", { precision: 12, scale: 2 }),
    notes: text("notes"),
    status: varchar("status", { length: 50 })
      .notNull()
      .default("submitted"),
    adminNotes: text("admin_notes"),
    quotedTotal: numeric("quoted_total", { precision: 12, scale: 2 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantStatusIdx: index("quote_tenant_status_idx").on(
      table.tenantId,
      table.status
    ),
  })
);

export type QuoteRequest = typeof quoteRequests.$inferSelect;
export type InsertQuoteRequest = typeof quoteRequests.$inferInsert;

export const authAccounts = pgTable(
  "auth_accounts",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 255 }).notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", {
      length: 255,
    }).notNull(),
    refreshToken: text("refresh_token"),
    accessToken: text("access_token"),
    expiresAt: integer("expires_at"),
    tokenType: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    idToken: text("id_token"),
    sessionState: varchar("session_state", { length: 255 }),
  },
  (table) => ({
    compoundKey: primaryKey({
      columns: [table.provider, table.providerAccountId],
    }),
  })
);

export const authSessions = pgTable("auth_sessions", {
  sessionToken: varchar("session_token", { length: 255 }).primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const authVerificationTokens = pgTable(
  "auth_verification_tokens",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => ({
    compoundKey: primaryKey({ columns: [table.identifier, table.token] }),
  })
);

export const tenantRelations = relations(tenants, ({ many }) => ({
  tenantUsers: many(tenantUsers),
  products: many(products),
  categories: many(categories),
  brands: many(brands),
  orders: many(orders),
  cartItems: many(cartItems),
  quoteRequests: many(quoteRequests),
}));

export const userRelations = relations(users, ({ many }) => ({
  tenantUsers: many(tenantUsers),
  cartItems: many(cartItems),
  orders: many(orders),
  ageVerifications: many(ageVerifications),
  quoteRequests: many(quoteRequests),
}));
