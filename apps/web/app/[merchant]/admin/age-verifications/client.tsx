"use client";

import { useState, useCallback } from "react";
import { useLocale } from "@/components/LocaleProvider";

export function AdminVerificationActions({
  verificationId,
  merchant,
}: {
  verificationId: number;
  merchant: string;
}) {
  const { t } = useLocale();
  const [action, setAction] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");

  const handleAction = useCallback(
    async (approve: boolean) => {
      setAction("loading");
      setErrorMsg("");

      try {
        const res = await fetch("/api/age-verification/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            verificationId,
            action: approve ? "approve" : "reject",
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Action failed");
        }

        setAction("done");
        setTimeout(() => window.location.reload(), 1000);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Action failed");
        setAction("error");
      }
    },
    [verificationId]
  );

  if (action === "done") {
    return (
      <p className="text-sm font-medium text-green-600">{t("admin.updated")}</p>
    );
  }

  return (
    <div>
      <div className="flex gap-3">
        <button
          onClick={() => handleAction(true)}
          disabled={action === "loading"}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
        >
          {action === "loading" ? t("admin.processing") : t("admin.approve")}
        </button>
        <button
          onClick={() => handleAction(false)}
          disabled={action === "loading"}
          className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
        >
          {t("admin.reject")}
        </button>
      </div>
      {errorMsg && (
        <p className="mt-2 text-sm text-red-600">{errorMsg}</p>
      )}
    </div>
  );
}

export function AdminVerificationList({
  records,
  merchant,
}: {
  records: Array<{
    id: number;
    userId: number;
    verificationStatus: string;
    verificationData: unknown;
    method: string;
    createdAt: Date;
    user: { name: string | null; email: string } | null;
  }>;
  merchant: string;
}) {
  const { t } = useLocale();

  const statusLabel = (status: string) => {
    switch (status) {
      case "approved": return t("admin.approved");
      case "rejected": return t("admin.rejected");
      default: return t("admin.pending");
    }
  };

  return (
    <div className="space-y-4">
      {records.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white p-12 text-center">
          <p className="text-gray-400">{t("admin.noPending")}</p>
        </div>
      ) : (
        records.map((record) => {
          const data = record.verificationData as Record<string, string> | null;

          return (
            <div
              key={record.id}
              className="rounded-xl border border-gray-100 bg-white p-6"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <p className="font-bold text-gray-900">
                    {data?.fullName || record.user?.name || t("admin.unknown")}
                  </p>
                  <p className="text-sm text-gray-500">
                    {record.user?.email}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    record.verificationStatus === "approved"
                      ? "bg-green-100 text-green-800"
                      : record.verificationStatus === "rejected"
                      ? "bg-red-100 text-red-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {statusLabel(record.verificationStatus)}
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
                <div>
                  <span className="text-gray-400">{t("admin.method")}:</span>{" "}
                  <span className="font-medium text-gray-900">
                    {record.method}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">{t("admin.date")}:</span>{" "}
                  <span className="font-medium text-gray-900">
                    {new Date(record.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {record.verificationStatus === "pending" && (
                <AdminVerificationActions
                  verificationId={record.id}
                  merchant={merchant}
                />
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
