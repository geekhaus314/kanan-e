import { db, schema } from "@kananos/database";
import { eq, and, desc, inArray } from "drizzle-orm";
import { getTenantBySlug } from "@/lib/tenant";
import { auth } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n";
import { notFound, redirect } from "next/navigation";
import { AdminVerificationActions, AdminVerificationList } from "./client";

export default async function AgeVerificationsAdminPage({
  params,
}: {
  params: Promise<{ merchant: string }>;
}) {
  const { merchant } = await params;
  const tenant = await getTenantBySlug(merchant);
  if (!tenant || !db) notFound();

  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const adminUser = await db
    .select()
    .from(schema.tenantUsers)
    .where(
      and(
        eq(schema.tenantUsers.userId, Number(session.user.id)),
        eq(schema.tenantUsers.tenantId, tenant.id)
      )
    )
    .limit(1)
    .then((r) => r[0]);

  if (!adminUser || adminUser.role !== "admin") notFound();

  const { t } = await getTranslations();

  const pendingRecords = await db
    .select()
    .from(schema.ageVerifications)
    .where(eq(schema.ageVerifications.verificationStatus, "pending"))
    .orderBy(desc(schema.ageVerifications.createdAt))
    .limit(100);

  const userIds = [...new Set(pendingRecords.map((r) => r.userId))];

  const users =
    userIds.length > 0
      ? await db
          .select()
          .from(schema.users)
          .where(
            and(...userIds.map((id) => eq(schema.users.id, id)))
          )
      : [];

  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  const historyRecords = await db
    .select()
    .from(schema.ageVerifications)
    .where(
      inArray(schema.ageVerifications.verificationStatus, ["approved", "rejected"])
    )
    .orderBy(desc(schema.ageVerifications.createdAt))
    .limit(50);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">
          {t("admin.reviewTitle")}
        </h1>
        <p className="mt-1 text-gray-500">
          {t("admin.reviewSubtitle")}
        </p>
      </div>

      <div className="mb-12">
        <h2 className="mb-4 text-lg font-bold text-gray-900">
          {t("admin.pendingReviews", { count: pendingRecords.length })}
        </h2>

        {pendingRecords.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-white p-12 text-center">
            <p className="text-gray-400">{t("admin.noPending")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRecords.map((record) => {
              const user = userMap[record.userId];
              const data = record.verificationData as Record<string, string> | null;

              return (
                <div
                  key={record.id}
                  className="rounded-xl border border-gray-100 bg-white p-6"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <p className="font-bold text-gray-900">
                        {data?.fullName || user?.name || t("admin.unknown")}
                      </p>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                      {t("admin.pending")}
                    </span>
                  </div>

                  <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">{t("admin.dob")}:</span>{" "}
                      <span className="font-medium text-gray-900">
                        {data?.dateOfBirth || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">{t("admin.age")}:</span>{" "}
                      <span className="font-medium text-gray-900">
                        {data?.age || "?"}
                      </span>
                    </div>
                    {data?.address && (
                      <div className="col-span-2">
                        <span className="text-gray-400">{t("admin.address")}:</span>{" "}
                        <span className="font-medium text-gray-900">
                          {data.address}
                          {data.city && `, ${data.city}`}
                          {data.state && `, ${data.state}`}
                          {data.zip && ` ${data.zip}`}
                        </span>
                      </div>
                    )}
                    <div className="col-span-2">
                      <span className="text-gray-400">{t("admin.submitted")}:</span>{" "}
                      <span className="font-medium text-gray-900">
                        {new Date(record.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-400">{t("admin.method")}:</span>{" "}
                      <span className="font-medium text-gray-900">
                        {record.method}
                      </span>
                    </div>
                  </div>

                  <AdminVerificationActions
                    verificationId={record.id}
                    merchant={merchant}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-bold text-gray-900">
          {t("admin.reviewHistory")}
        </h2>
        <AdminVerificationList records={historyRecords.map(r => ({
          ...r,
          user: userMap[r.userId] || null,
        }))} merchant={merchant} />
      </div>
    </div>
  );
}
