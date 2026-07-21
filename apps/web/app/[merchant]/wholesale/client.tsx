"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export function WholesaleRegistrationForm({
  merchant,
}: {
  merchant: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      setError("");

      try {
        const res = await fetch("/api/wholesale/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            merchant,
            businessName,
            taxId,
            licenseNumber,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Registration failed");

        setSuccess(true);
        setTimeout(() => router.refresh(), 1500);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Registration failed");
      } finally {
        setSubmitting(false);
      }
    },
    [merchant, businessName, taxId, licenseNumber, router]
  );

  if (success) {
    return (
      <div className="rounded-xl border border-green-100 bg-green-50 p-6">
        <p className="font-semibold text-green-800">
          Application submitted successfully!
        </p>
        <p className="mt-1 text-sm text-green-600">
          We will review your tobacco license and notify you when approved.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-100 bg-white p-6"
    >
      <div className="mb-6 space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Business Name
          </label>
          <input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Tax ID / EIN
          </label>
          <input
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
            placeholder="XX-XXXXXXX"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Tobacco License Number
          </label>
          <input
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-amber-400 px-6 py-3 text-sm font-bold text-gray-900 transition-colors hover:bg-amber-500 disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Submit Application"}
      </button>
    </form>
  );
}
