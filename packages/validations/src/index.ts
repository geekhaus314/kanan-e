import { z } from "zod";

export const positiveInt = z.number().int().positive();
export const quantity = z.number().int().min(1).max(9_999);
export const monetaryAmount = z
  .number()
  .min(0)
  .refine(
    (n) =>
      Number((n * 100).toFixed(0)) / 100 === n ||
      Math.round(n * 100) === n * 100,
    { message: "Monetary amounts must have at most 2 decimal places" }
  );

export const pagination = z.object({
  limit: z.number().int().min(1).max(200).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
});

export const safeSearchQuery = z
  .string()
  .max(200)
  .transform((s) => s.replace(/[%_\u200B-\u200D\uFEFF]/g, "").trim());

export const shippingAddressSchema = z.object({
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
  country: z.string().length(2).toUpperCase(),
});

export const createProductSchema = z.object({
  sku: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  categoryId: positiveInt.optional(),
  brandId: positiveInt.optional(),
  basePrice: monetaryAmount,
  wholesalePrice: monetaryAmount.optional(),
  stockLevel: z.number().int().min(0).default(0),
  isAgeRestricted: z.boolean().default(false),
  restrictedProductType: z
    .enum([
      "tobacco",
      "nicotine_vape",
      "delta8",
      "delta9",
      "smoking_accessory",
      "none",
    ])
    .default("none"),
});
