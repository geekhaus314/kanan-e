"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddToCartButton({
  productId,
  merchant,
  quantity = 1,
  isAgeRestricted = false,
  stockLevel = 0,
  variant = "premium",
  className,
}: {
  productId: number;
  merchant: string;
  quantity?: number;
  isAgeRestricted?: boolean;
  stockLevel?: number;
  variant?: "premium" | "outline";
  className?: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "adding" | "needauth" | "error">(
    "idle"
  );

  const handleAdd = async () => {
    setState("adding");
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity, merchant }),
      });
      if (res.status === 401) {
        setState("needauth");
        router.push(`/${merchant}/auth/signin`);
        return;
      }
      if (!res.ok) {
        setState("error");
        return;
      }
      setState("idle");
      router.refresh();
    } catch {
      setState("error");
    }
  };

  if (stockLevel <= 0) {
    return (
      <button
        disabled
        className="w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-gray-600"
      >
        Out of Stock
      </button>
    );
  }

  const base =
    variant === "premium"
      ? "btn-premium"
      : "btn-outline";

  return (
    <button
      onClick={handleAdd}
      disabled={state === "adding"}
      className={`${base} inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold disabled:opacity-50 ${className ?? ""}`}
    >
      {state === "adding" ? "Adding…" : isAgeRestricted ? "Add to Cart (21+)" : "Add to Cart"}
    </button>
  );
}
