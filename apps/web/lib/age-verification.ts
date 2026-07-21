import { db, schema } from "@kananos/database";
import { eq, and, desc } from "drizzle-orm";

const VERIFICATION_EXPIRY_DAYS = 365;

export function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function isValidAge(dob: string): { valid: boolean; age: number; error?: string } {
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) {
    return { valid: false, age: 0, error: "Invalid date of birth" };
  }

  const age = calculateAge(birthDate);
  if (age < 0) {
    return { valid: false, age: 0, error: "Date of birth cannot be in the future" };
  }
  if (age < 21) {
    return { valid: false, age, error: "You must be 21 or older to purchase age-restricted products" };
  }
  if (age > 120) {
    return { valid: false, age: 0, error: "Invalid date of birth" };
  }

  return { valid: true, age };
}

export interface VerificationInput {
  userId: number;
  fullName: string;
  dateOfBirth: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export async function getVerificationStatus(userId: number) {
  if (!db) return { verified: false, reason: "system_unavailable" };

  const verification = await db
    .select()
    .from(schema.ageVerifications)
    .where(
      and(
        eq(schema.ageVerifications.userId, userId),
        eq(schema.ageVerifications.verificationStatus, "approved")
      )
    )
    .orderBy(desc(schema.ageVerifications.createdAt))
    .limit(1)
    .then((r) => r[0]);

  if (!verification) {
    return { verified: false, reason: "not_verified" };
  }

  if (verification.expiresAt && verification.expiresAt < new Date()) {
    return { verified: false, reason: "expired" };
  }

  return { verified: true, verification };
}

export async function initiateVerification(input: VerificationInput) {
  if (!db) throw new Error("System unavailable - please try again later");

  const { valid: ageValid, age, error: ageError } = isValidAge(input.dateOfBirth);
  if (!ageValid) {
    return { success: false, error: ageError, status: "rejected" };
  }

  const existing = await getVerificationStatus(input.userId);
  if (existing.verified) {
    return { success: true, status: "already_verified", verification: existing.verification };
  }

  const hasAddressInfo = !!(input.address && input.city && input.state && input.zip);

  const verificationStatus = hasAddressInfo ? "pending" : "pending";

  const [record] = await db
    .insert(schema.ageVerifications)
    .values({
      userId: input.userId,
      method: "self_verified",
      verificationStatus,
      verificationData: {
        fullName: input.fullName,
        dateOfBirth: input.dateOfBirth,
        age,
        address: input.address,
        city: input.city,
        state: input.state,
        zip: input.zip,
        verifiedAt: new Date().toISOString(),
      },
      expiresAt: new Date(Date.now() + VERIFICATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    })
    .returning();

  if (verificationStatus === "pending") {
    return {
      success: true,
      status: "pending_review",
      message: "Your identity verification is under review. An administrator will review your information shortly.",
      verification: record,
    };
  }

  return {
    success: true,
    status: "approved",
    verification: record,
  };
}

export async function approveVerification(verificationId: number, adminUserId: number) {
  if (!db) throw new Error("System unavailable");

  const [updated] = await db
    .update(schema.ageVerifications)
    .set({
      verificationStatus: "approved",
      verificationData: (db as any).sql`jsonb_set(
        ${schema.ageVerifications.verificationData},
        '{reviewedBy}',
        ${JSON.stringify(adminUserId)}::jsonb,
        true
      )`,
      updatedAt: new Date(),
    })
    .where(eq(schema.ageVerifications.id, verificationId))
    .returning();

  return updated;
}

export async function rejectVerification(verificationId: number, adminUserId: number, reason?: string) {
  if (!db) throw new Error("System unavailable");

  const [updated] = await db
    .update(schema.ageVerifications)
    .set({
      verificationStatus: "rejected",
      verificationData: (db as any).sql`jsonb_set(
        ${schema.ageVerifications.verificationData},
        '{reviewedBy}',
        ${JSON.stringify(adminUserId)}::jsonb,
        true
      )`,
      updatedAt: new Date(),
    })
    .where(eq(schema.ageVerifications.id, verificationId))
    .returning();

  return updated;
}

export async function getPendingVerifications(tenantId: number) {
  if (!db) return [];

  const pendingRecords = await db
    .select()
    .from(schema.ageVerifications)
    .where(eq(schema.ageVerifications.verificationStatus, "pending"))
    .orderBy(desc(schema.ageVerifications.createdAt))
    .limit(100);

  const userIds = [...new Set(pendingRecords.map((r) => r.userId))];

  const users = userIds.length > 0
    ? await db
        .select()
        .from(schema.users)
        .where(
          and(
            ...userIds.map((id) => eq(schema.users.id, id))
          )
        )
    : [];

  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  return pendingRecords.map((record) => ({
    ...record,
    user: userMap[record.userId] ?? null,
  }));
}
