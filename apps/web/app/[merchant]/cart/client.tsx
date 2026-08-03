"use client";

import { brandTileFor } from "@/lib/brandTile";

import { useState } from "react";
import { ProductImage } from "@/components/ProductImage";

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

  const handleQuantityChange = async (itemId: number, delta: number) => {
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
      <div className="rounded-xl border border-white/10 bg-surface-card p-12 text-center">
        <p className="mb-4 text-gray-400">Your cart is empty.</p>
        <a
          href={`/${merchant}/products`}
          className="inline-block rounded-xl bg-gradient-brand px-6 py-3 text-sm font-bold text-gray-900 hover:opacity-90"
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
            className="flex items-center gap-4 rounded-xl border border-white/10 bg-surface-card p-4"
          >

            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/5">
              <ProductImage
                imageUrl={item.imageUrl}
                fallbackSrc={brandTileFor(item.sku)}
                alt={item.productName}
                className="text-2xl"
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-100">
                {item.productName}
              </p>
              <p className="text-xs text-gray-500">{item.sku}</p>
              <p className="mt-1 text-sm font-bold text-gold-400">
                ${parseFloat(item.priceAtAddition).toFixed(2)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleQuantityChange(item.id, -1)}
                disabled={item.quantity <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 disabled:opacity-30"
              >
                −
              </button>
              <span className="w-8 text-center text-sm font-bold text-gray-100">
                {item.quantity}
              </span>
              <button
                onClick={() => handleQuantityChange(item.id, 1)}
                disabled={item.quantity >= item.stockLevel}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 disabled:opacity-30"
              >
                +
              </button>
            </div>

            <p className="w-20 text-right text-sm font-bold text-gray-100">
              ${(parseFloat(item.priceAtAddition) * item.quantity).toFixed(2)}
            </p>

            <button
              onClick={() => handleRemove(item.id)}
              disabled={removingId === item.id}
              className="p-2 text-gray-500 hover:text-red-400 disabled:opacity-50"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-white/10 bg-surface-card p-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-gray-400">Subtotal</span>
          <span className="font-semibold text-gray-100">
            ${total.toFixed(2)}
          </span>
        </div>
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4 text-sm">
          <span className="text-gray-400">Shipping</span>
          <span className="font-semibold text-gray-100">Calculated at checkout</span>
        </div>
        <div className="mb-6 flex items-center justify-between">
          <span className="text-lg font-bold text-gray-100">Total</span>
          <span className="text-lg font-black text-gold-400">
            ${total.toFixed(2)}
          </span>
        </div>
        <a
          href={`/${merchant}/checkout`}
          className="block w-full rounded-xl bg-gradient-brand px-6 py-3 text-center text-sm font-bold text-gray-900 hover:opacity-90"
        >
          Proceed to Checkout
        </a>
      </div>
    </div>
  );
}
