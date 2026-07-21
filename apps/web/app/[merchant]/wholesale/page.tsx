import { db, schema } from "@kananos/database";
import { eq, and } from "drizzle-orm";
import { getTenantBySlug } from "@/lib/tenant";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { WholesaleRegistrationForm } from "./client";

export default async function WholesalePage({
  params,
}: {
  params: Promise<{ merchant: string }>;
}) {
  const { merchant } = await params;
  const tenant = await getTenantBySlug(merchant);
  if (!tenant || !db) notFound();

  const session = await auth();
  if (!session?.user?.id) redirect(`/${merchant}/auth/signin`);

  const userId = Number(session.user.id);

  const existing = await db
    .select()
    .from(schema.tenantUsers)
    .where(
      and(
        eq(schema.tenantUsers.userId, userId),
        eq(schema.tenantUsers.tenantId, tenant.id)
      )
    )
    .limit(1)
    .then((r) => r[0]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900">
            Wholesale Registration
          </h1>
          <p className="mt-1 text-gray-500">
            Apply for a wholesale account to access bulk pricing
          </p>
        </div>

        {existing?.isWholesale ? (
          <div className="rounded-xl border border-green-100 bg-green-50 p-6">
            <p className="font-semibold text-green-800">
              Your wholesale account is {existing.licenseVerifiedAt ? "approved" : "pending review"}.
            </p>
            <p className="mt-1 text-sm text-green-600">
              {existing.licenseVerifiedAt
                ? "You have access to wholesale pricing."
                : "We are reviewing your tobacco license. You will be notified when approved."}
            </p>
          </div>
        ) : existing?.tobaccoLicense ? (
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-6">
            <p className="font-semibold text-amber-800">
              Application submitted — pending review.
            </p>
            <p className="mt-1 text-sm text-amber-600">
              Your tobacco license is being reviewed by our team.
            </p>
          </div>
        ) : (
          <WholesaleRegistrationForm merchant={merchant} />
        )}
      </div>
    </div>
  );
}
