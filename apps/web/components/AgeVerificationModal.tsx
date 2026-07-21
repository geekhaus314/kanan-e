"use client";

import { useState, useCallback } from "react";

interface AgeVerificationModalProps {
  onVerified: () => void;
  onClose: () => void;
  merchant: string;
}

type Step = "dob" | "address" | "submitting" | "result";

export default function AgeVerificationModal({
  onVerified,
  onClose,
  merchant,
}: AgeVerificationModalProps) {
  const [step, setStep] = useState<Step>("dob");
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    status: string;
    message?: string;
  } | null>(null);

  const handleSubmitDOB = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError("");

      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      if (age < 21) {
        setError("You must be 21 or older to purchase age-restricted products.");
        return;
      }

      if (age > 120) {
        setError("Invalid date of birth.");
        return;
      }

      setStep("address");
    },
    [dateOfBirth]
  );

  const handleVerify = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setStep("submitting");

      try {
        const res = await fetch("/api/age-verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName,
            dateOfBirth,
            address,
            city,
            state,
            zip,
          }),
        });

        const data = await res.json();
        setResult(data);

        if (data.status === "approved" || data.status === "already_verified") {
          setStep("result");
          setTimeout(() => onVerified(), 1500);
        } else if (data.status === "pending_review") {
          setStep("result");
        } else {
          setError(data.error || "Verification failed");
          setStep("address");
        }
      } catch {
        setError("An error occurred. Please try again.");
        setStep("address");
      }
    },
    [fullName, dateOfBirth, address, city, state, zip, onVerified]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        {step === "dob" && (
          <form onSubmit={handleSubmitDOB}>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-2xl">
                🔞
              </div>
              <h2 className="text-xl font-black text-gray-900">
                Age Verification Required
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                You must be 21 or older to purchase age-restricted products.
              </p>
            </div>

            <div className="mb-4">
              <label
                htmlFor="dob-dob"
                className="mb-1.5 block text-sm font-semibold text-gray-900"
              >
                Date of Birth
              </label>
              <input
                id="dob-dob"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
              />
            </div>

            {error && (
              <p className="mb-4 text-sm font-medium text-red-600">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-gray-900 transition-colors hover:bg-amber-500"
              >
                Continue
              </button>
            </div>
          </form>
        )}

        {step === "address" && (
          <form onSubmit={handleVerify}>
            <div className="mb-6">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-gray-900">
                  2
                </span>
                <h2 className="text-lg font-bold text-gray-900">
                  Identity Verification
                </h2>
              </div>
              <p className="text-sm text-gray-500">
                Enter your full name and address to complete verification. This
                helps us confirm your identity.
              </p>
            </div>

            <div className="mb-4">
              <label
                htmlFor="name"
                className="mb-1.5 block text-sm font-semibold text-gray-900"
              >
                Full Legal Name
              </label>
              <input
                id="name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Jane Smith"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="street"
                className="mb-1.5 block text-sm font-semibold text-gray-900"
              >
                Street Address
              </label>
              <input
                id="street"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
              />
            </div>

            <div className="mb-4 grid grid-cols-3 gap-3">
              <div>
                <label
                  htmlFor="city"
                  className="mb-1.5 block text-sm font-semibold text-gray-900"
                >
                  City
                </label>
                <input
                  id="city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                />
              </div>
              <div>
                <label
                  htmlFor="state"
                  className="mb-1.5 block text-sm font-semibold text-gray-900"
                >
                  State
                </label>
                <input
                  id="state"
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  maxLength={2}
                  placeholder="MO"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                />
              </div>
              <div>
                <label
                  htmlFor="zip"
                  className="mb-1.5 block text-sm font-semibold text-gray-900"
                >
                  ZIP
                </label>
                <input
                  id="zip"
                  type="text"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  placeholder="63031"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                />
              </div>
            </div>

            {error && (
              <p className="mb-4 text-sm font-medium text-red-600">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("dob")}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-gray-900 transition-colors hover:bg-amber-500"
              >
                Verify Identity
              </button>
            </div>
          </form>
        )}

        {step === "submitting" && (
          <div className="py-10 text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
            <p className="text-sm font-medium text-gray-600">
              Verifying your identity...
            </p>
          </div>
        )}

        {step === "result" && result && (
          <div className="text-center">
            {result.status === "approved" ||
            result.status === "already_verified" ? (
              <>
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">
                  ✅
                </div>
                <h2 className="mb-1 text-xl font-black text-green-700">
                  Verified!
                </h2>
                <p className="mb-6 text-sm text-gray-500">
                  Your age has been verified. Redirecting...
                </p>
              </>
            ) : (
              <>
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-2xl">
                  🕐
                </div>
                <h2 className="mb-1 text-xl font-black text-gray-900">
                  Verification Pending
                </h2>
                <p className="mb-6 text-sm text-gray-500">
                  {result.message ||
                    "An administrator will review your information shortly."}
                </p>
                <button
                  onClick={onClose}
                  className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
                >
                  OK
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
