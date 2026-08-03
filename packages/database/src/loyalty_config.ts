import {
  pgTable,
  serial,
  integer,
  varchar,
  jsonb,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

// Per-tenant editable loyalty configuration. ALL reward amounts, wheel
// weights, and limits live here so they can be tuned without a code deploy.
// Code only holds a safe DEFAULT (see apps/web/lib/loyalty.ts) used when no
// row exists yet.
export const loyaltyConfig = pgTable(
  "loyalty_config",
  {
    id: serial("id").primaryKey(),
    tenantId: integer("tenant_id").notNull().unique(),
    // 0 = Sunday start (US calendar default), 1 = Monday
    weekStart: integer("week_start").default(0).notNull(),
    // points awarded on each LINEAR check-in day (Sunday=1 .. Saturday=7).
    // The Wednesday slot (day index 4 when weekStart=0) is the wheel, not linear.
    dayPoints: jsonb("day_points")
      .$type<Record<number, number>>()
      .notNull(),
    // Wednesday is the wheel day. Kept explicit so it can move.
    wheelDay: integer("wheel_day").default(4).notNull(),
    // Weighted wheel segments. Server picks via Math.random() over `weight`.
    wheelPrizes: jsonb("wheel_prizes")
      .$type<
        Array<{
          key: string;
          label: string;
          kind: "points" | "percent" | "fixed" | "freeitem";
          weight: number;
          value: number; // points count, or % off, or $ off, or free-item SKU id
          sku?: string; // for freeitem
          minSpend?: number; // for percent/fixed coupons
        }>
      >()
      .notNull(),
    // how many wheel spins a user gets per week
    weeklySpins: integer("weekly_spins").default(1).notNull(),
    // coupon validity in days from issuance
    couponDays: integer("coupon_days").default(30).notNull(),
    active: boolean("active").default(true).notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    byTenant: index("loyalty_config_tenant").on(t.tenantId),
  })
);
export type LoyaltyConfig = typeof loyaltyConfig.$inferSelect;
