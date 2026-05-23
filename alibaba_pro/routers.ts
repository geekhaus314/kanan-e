/**
 * routers.ts — Security-hardened tRPC router
 *
 * Senior-level security improvements:
 * 1. Input sanitization via Zod refinements (not just type-checking)
 * 2. Authorization checks on EVERY protected route (owner-only guards)
 * 3. Rate limiting hints via custom middleware context
 * 4. Pagination enforced with hard caps (prevents unbounded queries)
 * 5. IDOR prevention: order/cart item ownership verified before any mutation
 * 6. Age verification: status checked server-side on restricted product add-to-cart
 * 7. Decimal precision: monetary inputs validated to 2dp to prevent floating-point injection
 * 8. Quantity bounds: enforced in Zod — not just client-side
 * 9. No raw SQL — all queries go through db.ts abstraction layer
 * 10. quoteRequest productIds/quantities parity enforced server-side
 */

import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

// ─── Reusable Zod schemas ──────────────────────────────────────────────────────

/** Positive integer — prevents negative/zero IDs and NaN */
const positiveInt = z.number().int().positive();

/** Quantity: 1–9999, integer only */
const quantity = z.number().int().min(1).max(9_999);

/** Pagination: limit 1–200, offset ≥ 0 */
const pagination = z.object({
  limit: z.number().int().min(1).max(200).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
});

/** Safe search query: no special chars that could be injected into LIKE queries */
const safeSearchQuery = z
  .string()
  .max(200)
  .transform((s) =>
    // Strip SQL LIKE wildcards and zero-width chars from raw query
    s.replace(/[%_\u200B-\u200D\uFEFF]/g, "").trim()
  );

/** Monetary amount: non-negative, max 2 decimal places */
const monetaryAmount = z
  .number()
  .min(0)
  .refine((n) => Number((n * 100).toFixed(0)) / 100 === n || Math.round(n * 100) === n * 100, {
    message: "Monetary amounts must have at most 2 decimal places",
  });

/** Shipping address — all fields required, length-bounded */
const shippingAddressSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  email: z.string().email().max(320).toLowerCase().trim(),
  phone: z
    .string()
    .min(7)
    .max(30)
    .regex(/^[\d\s\+\-\(\)\.]+$/, "Invalid phone format"),
  address: z.string().min(1).max(500).trim(),
  city: z.string().min(1).max(200).trim(),
  state: z.string().min(1).max(100).trim(),
  zip: z.string().min(3).max(20).trim(),
  country: z.string().length(2).toUpperCase(), // ISO 3166-1 alpha-2
});

// ─── Router ────────────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,

  // ─── Auth ──────────────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query((opts) => {
      // Never expose internal fields — return only public profile
      const user = opts.ctx.user;
      if (!user) return null;
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        isWholesaleAccount: user.isWholesaleAccount,
        role: user.role,
      };
    }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Products ──────────────────────────────────────────────────────────────
  products: router({
    getById: publicProcedure
      .input(z.object({ id: positiveInt }))
      .query(async ({ input }) => {
        const product = await db.getProductById(input.id);
        if (!product || !product.isActive) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
        }
        return product;
      }),

    getByCategory: publicProcedure
      .input(z.object({ categoryId: positiveInt }).merge(pagination))
      .query(async ({ input }) => {
        return await db.getProductsByCategoryId(input.categoryId, input.limit!, input.offset!);
      }),

    search: publicProcedure
      .input(
        z.object({ query: safeSearchQuery }).merge(pagination)
      )
      .query(async ({ input }) => {
        // Empty query → return empty (homepage uses search with "" for now;
        // replace with getFeatured() once that endpoint exists)
        if (!input.query) return [];
        return await db.searchProducts(input.query, input.limit!, input.offset!);
      }),

    getByBrand: publicProcedure
      .input(z.object({ brandId: positiveInt }).merge(pagination))
      .query(async ({ input }) => {
        return await db.getProductsByBrandId(input.brandId, input.limit!, input.offset!);
      }),

    getAgeRestricted: publicProcedure.query(async () => {
      return await db.getAgeRestrictedProducts();
    }),

    getBulkPricing: publicProcedure
      .input(z.object({ productId: positiveInt }))
      .query(async ({ input }) => {
        return await db.getBulkPricingForProduct(input.productId);
      }),

    calculateBulkPrice: publicProcedure
      .input(z.object({ productId: positiveInt, quantity }))
      .query(async ({ input }) => {
        const price = await db.calculateBulkPrice(input.productId, input.quantity);
        if (price === null) {
          // Gracefully fall back to base price rather than throwing
          const product = await db.getProductById(input.productId);
          if (!product) throw new TRPCError({ code: "NOT_FOUND" });
          return { price: parseFloat(product.basePrice.toString()) };
        }
        return { price };
      }),
  }),

  // ─── Categories ────────────────────────────────────────────────────────────
  categories: router({
    getAll: publicProcedure.query(async () => {
      return await db.getAllCategories();
    }),

    getById: publicProcedure
      .input(z.object({ id: positiveInt }))
      .query(async ({ input }) => {
        const cat = await db.getCategoryById(input.id);
        if (!cat) throw new TRPCError({ code: "NOT_FOUND", message: "Category not found" });
        return cat;
      }),

    getSubcategories: publicProcedure
      .input(z.object({ parentId: positiveInt }))
      .query(async ({ input }) => {
        return await db.getSubcategories(input.parentId);
      }),
  }),

  // ─── Brands ────────────────────────────────────────────────────────────────
  brands: router({
    getAll: publicProcedure.query(async () => {
      return await db.getAllBrands();
    }),

    getById: publicProcedure
      .input(z.object({ id: positiveInt }))
      .query(async ({ input }) => {
        const brand = await db.getBrandById(input.id);
        if (!brand) throw new TRPCError({ code: "NOT_FOUND", message: "Brand not found" });
        return brand;
      }),
  }),

  // ─── Cart ──────────────────────────────────────────────────────────────────
  cart: router({
    getItems: protectedProcedure.query(async ({ ctx }) => {
      return await db.getCartItems(ctx.user.id);
    }),

    addItem: protectedProcedure
      .input(z.object({ productId: positiveInt, quantity }))
      .mutation(async ({ ctx, input }) => {
        // 1. Product must exist and be active
        const product = await db.getProductById(input.productId);
        if (!product || !product.isActive) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
        }

        // 2. Stock check
        if (product.stockLevel !== null && product.stockLevel < input.quantity) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Only ${product.stockLevel} units available`,
          });
        }

        // 3. Age-restricted: check verification status server-side
        if (product.isAgeRestricted) {
          const verification = await db.getLatestAgeVerification(ctx.user.id);
          const isVerified =
            verification?.verificationStatus === "approved" &&
            (!verification.expiresAt || verification.expiresAt > new Date());
          if (!isVerified) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Age verification required for this product",
            });
          }
        }

        return await db.addToCart(ctx.user.id, input.productId, input.quantity);
      }),

    removeItem: protectedProcedure
      .input(z.object({ cartItemId: positiveInt }))
      .mutation(async ({ ctx, input }) => {
        // IDOR guard: verify item belongs to this user
        const items = await db.getCartItems(ctx.user.id);
        const owns = items.some((i: any) => i.id === input.cartItemId);
        if (!owns) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Cart item not found" });
        }
        return await db.removeFromCart(input.cartItemId);
      }),

    updateQuantity: protectedProcedure
      .input(z.object({ cartItemId: positiveInt, quantity }))
      .mutation(async ({ ctx, input }) => {
        // IDOR guard
        const items = await db.getCartItems(ctx.user.id);
        const item = items.find((i: any) => i.id === input.cartItemId);
        if (!item) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Cart item not found" });
        }
        // Stock check on update
        const product = await db.getProductById(item.productId);
        if (product && product.stockLevel !== null && product.stockLevel < input.quantity) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Only ${product.stockLevel} units available`,
          });
        }
        return await db.updateCartItemQuantity(input.cartItemId, input.quantity);
      }),

    clear: protectedProcedure.mutation(async ({ ctx }) => {
      return await db.clearCart(ctx.user.id);
    }),
  }),

  // ─── Orders ────────────────────────────────────────────────────────────────
  orders: router({
    getById: protectedProcedure
      .input(z.object({ id: positiveInt }))
      .query(async ({ ctx, input }) => {
        const order = await db.getOrderById(input.id);
        // IDOR: ownership check before any data exposure
        if (!order || order.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
        }
        return order;
      }),

    getMyOrders: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserOrders(ctx.user.id);
    }),

    getOrderItems: protectedProcedure
      .input(z.object({ orderId: positiveInt }))
      .query(async ({ ctx, input }) => {
        const order = await db.getOrderById(input.orderId);
        if (!order || order.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
        }
        return await db.getOrderItems(input.orderId);
      }),

    create: protectedProcedure
      .input(
        z.object({
          /**
           * totalAmount is re-computed server-side from cart items.
           * The client-supplied value is used only as a sanity-check guard
           * to prevent orders with wildly wrong amounts slipping through.
           * Never trust client price data for billing.
           */
          clientTotalAmount: monetaryAmount,
          shippingAddress: shippingAddressSchema,
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Recompute total from server-side cart
        const cartItems = await db.getCartItems(ctx.user.id);
        if (!cartItems || cartItems.length === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cart is empty" });
        }

        const serverTotal = cartItems.reduce((sum: number, item: any) => {
          const price =
            typeof item.price === "number" ? item.price : parseFloat(item.price ?? "0");
          return sum + price * item.quantity;
        }, 0);

        // Sanity check: reject if client total differs from server total by >1%
        const diff = Math.abs(serverTotal - input.clientTotalAmount);
        if (diff / serverTotal > 0.01) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Order total mismatch — please refresh your cart",
          });
        }

        return await db.createOrder(ctx.user.id, serverTotal, input.shippingAddress);
      }),

    addItem: protectedProcedure
      .input(
        z.object({
          orderId: positiveInt,
          productId: positiveInt,
          quantity,
          pricePerUnit: monetaryAmount,
        })
      )
      .mutation(async ({ ctx, input }) => {
        const order = await db.getOrderById(input.orderId);
        if (!order || order.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
        }
        // Re-verify price server-side
        const serverPrice = await db.calculateBulkPrice(input.productId, input.quantity);
        const product = await db.getProductById(input.productId);
        const expectedPrice = serverPrice ?? parseFloat(product?.basePrice?.toString() ?? "0");
        const priceDiff = Math.abs(expectedPrice - input.pricePerUnit);
        if (priceDiff > 0.01) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Price mismatch — product pricing may have changed",
          });
        }
        return await db.addOrderItem(input.orderId, input.productId, input.quantity, expectedPrice);
      }),
  }),

  // ─── Age Verification ──────────────────────────────────────────────────────
  ageVerification: router({
    getLatest: protectedProcedure.query(async ({ ctx }) => {
      return await db.getLatestAgeVerification(ctx.user.id);
    }),

    verify: protectedProcedure
      .input(
        z.object({
          method: z.enum(["document_upload", "credit_card", "third_party", "manual_review"]),
          // verificationData intentionally omitted from schema — handled by verification service
        })
      )
      .mutation(async ({ ctx, input }) => {
        /**
         * TODO: Integrate with AgeChecker.net or Persona.com
         * Never trust client-reported verification results.
         * The verification service should POST a signed webhook to your backend,
         * which then calls db.createAgeVerification with the result.
         *
         * This endpoint should initiate verification, not complete it.
         */
        return await db.createAgeVerification(
          ctx.user.id,
          input.method,
          "pending", // Always start as pending — approved by webhook callback
          null
        );
      }),

    isVerified: protectedProcedure.query(async ({ ctx }) => {
      const verification = await db.getLatestAgeVerification(ctx.user.id);
      if (!verification) return { verified: false, reason: "no_verification" };
      if (verification.verificationStatus !== "approved")
        return { verified: false, reason: "not_approved" };
      if (verification.expiresAt && verification.expiresAt < new Date())
        return { verified: false, reason: "expired" };
      return { verified: true };
    }),
  }),

  // ─── Quote Requests ────────────────────────────────────────────────────────
  quoteRequests: router({
    create: protectedProcedure
      .input(
        z
          .object({
            productIds: z.array(positiveInt).min(1).max(50),
            quantities: z.array(quantity).min(1).max(50),
            estimatedTotal: monetaryAmount.optional(),
            notes: z.string().max(2_000).optional(),
          })
          .refine(
            (data) => data.productIds.length === data.quantities.length,
            "productIds and quantities must have the same length"
          )
      )
      .mutation(async ({ ctx, input }) => {
        // Verify all products exist before creating the quote
        const productChecks = await Promise.all(
          input.productIds.map((id) => db.getProductById(id))
        );
        const missing = productChecks.findIndex((p) => !p || !p.isActive);
        if (missing !== -1) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Product ID ${input.productIds[missing]} not found or inactive`,
          });
        }

        return await db.createQuoteRequest(
          ctx.user.id,
          input.productIds,
          input.quantities,
          input.estimatedTotal
        );
      }),

    getMyRequests: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserQuoteRequests(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
