"use client";

import { useState } from "react";

type CartItem = {
  id: number;
  productId: number;
  quantity: number;
  priceAtAddition: string;
  productName: string;
  sku: string;
  imageUrl: string | null;
  basePrice: string;
  isAgeRestricted: boolean;
  stockLevel: number;
  lineTotal: number;
};

export function CartContents({
  items,
  subtotal,
  merchant,
}: {
  items: CartItem[];
  subtotal: number;
  merchant: string;
}) {
  const [localItems, setLocalItems] = useState(items);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const handleQuantityChange = async (
    itemId: number,
    delta: number
  ) => {
    setLocalItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? { ...i, quantity: Math.max(1, i.quantity + delta) }
          : i
      )
    );
  };

  const handleRemove = async (itemId: number) => {
    setRemovingId(itemId);
    try {
      await fetch(`/api/cart?itemId=${itemId}`, { method: "DELETE" });
      setLocalItems((prev) => prev.filter((i) => i.id !== itemId));
    } finally {
      setRemovingId(null);
    }
  };

  if (localItems.length === 0) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-12 text-center">
        <p className="mb-4 text-gray-400">Your cart is empty.</p>
        <a
          href={`/${merchant}/products`}
          className="inline-block rounded-xl bg-amber-400 px-6 py-3 text-sm font-bold text-gray-900 hover:bg-amber-500"
        >
          Browse Products
        </a>
      </div>
    );
  }

  const total = localItems.reduce(
    (sum, i) => sum + parseFloat(i.priceAtAddition) * i.quantity,
    0
  );

  return (
    <div>
      <div className="space-y-3">
        {localItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4"
          >
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gray-50">
              <span className="text-2xl text-gray-300">
                {item.isAgeRestricted ? "🚬" : "📦"}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">
                {item.productName}
              </p>
              <p className="text-xs text-gray-400">{item.sku}</p>
              <p className="mt-1 text-sm font-bold text-amber-600">
                ${parseFloat(item.priceAtAddition).toFixed(2)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleQuantityChange(item.id, -1)}
                disabled={item.quantity <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30"
              >
                −
              </button>
              <span className="w-8 text-center text-sm font-bold text-gray-900">
                {item.quantity}
              </span>
              <button
                onClick={() => handleQuantityChange(item.id, 1)}
                disabled={item.quantity >= item.stockLevel}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30"
              >
                +
              </button>
            </div>

            <p className="w-20 text-right text-sm font-bold text-gray-900">
              ${(parseFloat(item.priceAtAddition) * item.quantity).toFixed(2)}
            </p>

            <button
              onClick={() => handleRemove(item.id)}
              disabled={removingId === item.id}
              className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-50"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-gray-100 bg-white p-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-gray-500">Subtotal</span>
          <span className="font-semibold text-gray-900">
            ${total.toFixed(2)}
          </span>
        </div>
        <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-4 text-sm">
          <span className="text-gray-500">Shipping</span>
          <span className="font-semibold text-gray-900">Calculated at checkout</span>
        </div>
        <div className="mb-6 flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">Total</span>
          <span className="text-lg font-black text-amber-600">
            ${total.toFixed(2)}
          </span>
        </div>
        <a
          href={`/${merchant}/checkout`}
          className="block w-full rounded-xl bg-amber-400 px-6 py-3 text-center text-sm font-bold text-gray-900 hover:bg-amber-500"
        >
          Proceed to Checkout
        </a>
      </div>
    </div>
  );
}
