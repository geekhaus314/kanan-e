"use client";

import { useEffect, useState } from "react";

export function CartBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch("/api/cart");
        if (res.ok) {
          const items = await res.json();
          setCount(items.length);
        }
      } catch {
        // ignore
      }
    };

    fetchCount();

    const handler = () => fetchCount();
    window.addEventListener("cart-updated", handler);
    return () => window.removeEventListener("cart-updated", handler);
  }, []);

  if (count === 0) return null;

  return (
    <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1.5 text-[10px] font-bold text-gray-900">
      {count > 99 ? "99+" : count}
    </span>
  );
}
