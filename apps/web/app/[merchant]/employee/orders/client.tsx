"use client";

import { useState, useCallback } from "react";
import { useLocale } from "@/components/LocaleProvider";

export function MarkShippedButton({
  orderId,
  merchant,
  delivered,
}: {
  orderId: number;
  merchant: string;
  delivered?: boolean;
}) {
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleClick = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          status: delivered ? "delivered" : "shipped",
        }),
      });
      if (res.ok) {
        setDone(true);
        setTimeout(() => window.location.reload(), 800);
      }
    } finally {
      setLoading(false);
    }
  }, [orderId, delivered]);

  if (done) {
    return (
      <span className="text-sm font-medium text-green-600">
        {t("employee.shipped")}
      </span>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
    >
      {loading
        ? "..."
        : delivered
        ? t("employee.markDelivered")
        : t("employee.markShipped")}
    </button>
  );
}
