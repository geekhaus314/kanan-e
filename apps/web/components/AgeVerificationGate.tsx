"use client";

import { useState, useCallback, useEffect } from "react";
import AgeVerificationModal from "./AgeVerificationModal";

export function AgeVerificationGate({
  merchant,
  isAgeRestricted,
  productId,
}: {
  merchant: string;
  isAgeRestricted: boolean;
  productId: number;
}) {
  const [showModal, setShowModal] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isAgeRestricted) {
      setChecking(false);
      setIsVerified(true);
      return;
    }

    fetch("/api/age-verification/status")
      .then((r) => r.json())
      .then((data) => {
        setIsVerified(data.verified === true);
        setChecking(false);
      })
      .catch(() => {
        setIsVerified(false);
        setChecking(false);
      });
  }, [isAgeRestricted]);

  const handleAddToCart = useCallback(async () => {
    if (!isAgeRestricted || isVerified) {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      if (res.ok) {
        window.dispatchEvent(new CustomEvent("cart-updated"));
      }
      return;
    }
    setShowModal(true);
  }, [isAgeRestricted, isVerified, productId]);

  if (checking) {
    return (
      <button
        disabled
        className="mt-4 w-full rounded-xl bg-white/5 px-6 py-3 text-sm font-bold text-gray-600"
      >
        Loading...
      </button>
    );
  }

  return (
    <>
      {isAgeRestricted && !isVerified && (
        <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-sm font-semibold text-amber-300">
            21+ Age Verification Required
          </p>
          <p className="mt-1 text-sm text-gray-500">
            You must verify your age before adding this item to your cart.
          </p>
        </div>
      )}

      <button
        onClick={handleAddToCart}
        className="btn-premium mt-4 w-full px-6 py-3 text-sm"
      >
        {isAgeRestricted && !isVerified
          ? "Verify Age to Add to Cart"
          : "Add to Cart"}
      </button>

      {showModal && (
        <AgeVerificationModal
          merchant={merchant}
          onVerified={() => {
            setShowModal(false);
            setIsVerified(true);
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
