"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type CheckoutItem = {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
};

export function CheckoutForm({
  merchant,
  items,
  total,
}: {
  merchant: string;
  items: CheckoutItem[];
  total: number;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
    notes: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      setError("");

      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            merchant,
            items,
            total,
            shippingAddress: form,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Order failed");

        router.push(`/${merchant}/account/orders/${data.orderId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Order failed");
      } finally {
        setSubmitting(false);
      }
    },
    [merchant, items, total, form, router]
  );

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
      <h2 className="mb-4 text-lg font-bold text-gray-100">
        Shipping Information
      </h2>

      <div className="mb-4 grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-400">
            Full Name
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 placeholder-gray-600"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-400">
            Email
          </label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 placeholder-gray-600"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-400">
            Phone
          </label>
          <input
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 placeholder-gray-600"
          />
        </div>
        <div className="col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-400">
            Address
          </label>
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 placeholder-gray-600"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-400">
            City
          </label>
          <input
            name="city"
            value={form.city}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 placeholder-gray-600"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">
              State
            </label>
            <input
              name="state"
              value={form.state}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 placeholder-gray-600"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">
              ZIP
            </label>
            <input
              name="zip"
              value={form.zip}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 placeholder-gray-600"
            />
          </div>
        </div>
        <div className="col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-400">
            Order Notes (optional)
          </label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 placeholder-gray-600"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-sm text-amber-300">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="btn-premium w-full px-6 py-3 text-sm"
      >
        {submitting ? "Placing Order..." : `Place Order — $${total.toFixed(2)}`}
      </button>

      <p className="mt-3 text-center text-xs text-gray-500">
        You will be contacted to complete payment for this order.
      </p>
    </form>
  );
}
