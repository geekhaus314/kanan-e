"use client";

import { useState } from "react";

// Renders a real product photo when imageUrl is set, then falls back to a
// branded asset (fallbackSrc), and finally to a neutral placeholder tile.
// No emoji fallbacks.
export function ProductImage({
  imageUrl,
  fallbackSrc,
  alt,
  className,
}: {
  imageUrl?: string | null;
  fallbackSrc?: string | null;
  alt: string;
  className?: string;
}) {
  const [stage, setStage] = useState<number>(imageUrl ? 0 : fallbackSrc ? 1 : 2);

  if (stage === 0 && imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={alt}
        loading="lazy"
        onError={() => setStage(fallbackSrc ? 1 : 2)}
        className={`h-full w-full object-contain ${className ?? ""}`}
      />
    );
  }
  if (stage === 1 && fallbackSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={fallbackSrc}
        alt={alt}
        loading="lazy"
        onError={() => setStage(2)}
        className={`h-full w-full object-contain ${className ?? ""}`}
      />
    );
  }
  return (
    <span className={`flex h-full w-full items-center justify-center rounded-lg bg-white/5 text-gold-500/40 ${className ?? ""}`}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 15l5-5 4 4 3-3 6 6" />
      </svg>
    </span>
  );
}
