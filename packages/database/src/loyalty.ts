import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  numeric,
  boolean,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

// ── Loyalty point balances per (user, tenant) ──────────────────────────────
export const loyaltyProfiles = pgTable(
  "loyalty_profiles",
  {
    id: serial("id").primaryKey(),
    tenantId: integer("tenant_id").notNull(),
    userId: integer("user_id").notNull(),
    points: integer("points").default(0).notNull(),
    totalEarned: integer("total_earned").default(0).notNull(),
    checkinStreak: integer("checkin_streak").default(0).notNull(),
    lastCheckinAt: timestamp("last_checkin_at"),
    spinsUsed: integer("spins_used").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    uniq: index("loyalty_profile_uniq").on(t.tenantId, t.userId),
  })
);
export type LoyaltyProfile = typeof loyaltyProfiles.$inferSelect;

// ── Point ledger (every earn/spend is an audited row) ─────────────────────
export const pointsLedger = pgTable(
  "points_ledger",
  {
    id: serial("id").primaryKey(),
    tenantId: integer("tenant_id").notNull(),
    userId: integer("user_id").notNull(),
    delta: integer("delta").notNull(), // +earn / -spend
    reason: varchar("reason", { length: 60 }).notNull(), // checkin | wheel | signup | redeem | purchase
    refId: integer("ref_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    byUser: index("points_ledger_user").on(t.tenantId, t.userId),
  })
);
export type PointsLedger = typeof pointsLedger.$inferSelect;

// ── Coupons issued from points / wheel (real, redeemable) ─────────────────
export const coupons = pgTable(
  "coupons",
  {
    id: serial("id").primaryKey(),
    tenantId: integer("tenant_id").notNull(),
    userId: integer("user_id").notNull(),
    code: varchar("code", { length: 24 }).notNull().unique(),
    type: varchar("type", { length: 20 }).notNull(), // percent | fixed | freeitem
    value: numeric("value", { precision: 10, scale: 2 }).default("0").notNull(),
    minSpend: numeric("min_spend", { precision: 10, scale: 2 }).default("0"),
    redeemed: boolean("redeemed").default(false).notNull(),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    byUser: index("coupons_user").on(t.tenantId, t.userId),
  })
);
export type Coupon = typeof coupons.$inferSelect;

// ── Daily check-in ledger ─────────────────────────────────────────────────
export const checkins = pgTable(
  "checkins",
  {
    id: serial("id").primaryKey(),
    tenantId: integer("tenant_id").notNull(),
    userId: integer("user_id").notNull(),
    day: integer("day").notNull(), // 1..7 streak position
    points: integer("points").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    byUser: index("checkins_user").on(t.tenantId, t.userId),
  })
);
export type Checkin = typeof checkins.$inferSelect;

// ── Wheel spin ledger ─────────────────────────────────────────────────────
export const wheelSpins = pgTable(
  "wheel_spins",
  {
    id: serial("id").primaryKey(),
    tenantId: integer("tenant_id").notNull(),
    userId: integer("user_id").notNull(),
    prize: varchar("prize", { length: 40 }).notNull(), // matches wheel segment key
    value: integer("value").notNull().default(0),
    claimed: boolean("claimed").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    byUser: index("wheel_spins_user").on(t.tenantId, t.userId),
  })
);
export type WheelSpin = typeof wheelSpins.$inferSelect;
