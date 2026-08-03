"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Cat = { id: number; name: string };
type Brand = { id: number; name: string };

export function ProductForm({
  merchant,
  categories,
  brands,
  initial,
  productId,
}: {
  merchant: string;
  categories: Cat[];
  brands: Brand[];
  initial?: Record<string, string | number | boolean | null>;
  productId?: number;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: (initial?.name as string) ?? "",
    sku: (initial?.sku as string) ?? "",
    description: (initial?.description as string) ?? "",
    categoryId: (initial?.categoryId as number) ?? "",
    brandId: (initial?.brandId as number) ?? "",
    imageUrl: (initial?.imageUrl as string) ?? "",
    basePrice: (initial?.basePrice as string) ?? "",
    wholesalePrice: (initial?.wholesalePrice as string) ?? "",
    stockLevel: (initial?.stockLevel as number) ?? 0,
    isAgeRestricted: (initial?.isAgeRestricted as boolean) ?? false,
    restrictedProductType: (initial?.restrictedProductType as string) ?? "none",
    isActive: (initial?.isActive as boolean) ?? true,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof form, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      name: form.name,
      sku: form.sku || null,
      description: form.description || null,
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      brandId: form.brandId ? Number(form.brandId) : null,
      imageUrl: form.imageUrl || null,
      basePrice: String(form.basePrice || "0"),
      wholesalePrice: form.wholesalePrice ? String(form.wholesalePrice) : null,
      stockLevel: Number(form.stockLevel) || 0,
      isAgeRestricted: form.isAgeRestricted,
      restrictedProductType: form.restrictedProductType,
      isActive: form.isActive,
    };
    const res = await fetch(
      productId
        ? `/api/admin/products/${productId}?merchant=${merchant}`
        : `/api/admin/products?merchant=${merchant}`,
      {
        method: productId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (res.ok) {
      router.push(`/${merchant}/admin/products`);
      router.refresh();
    } else {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Save failed");
      setSaving(false);
    }
  };

  const input = "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-100 focus:border-amber-400 focus:outline-none";
  const label = "mb-1 block text-xs font-medium text-gray-500";

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={label}>Name *</label>
          <input className={input} value={form.name} onChange={(e) => set("name", e.target.value)} required />
        </div>
        <div>
          <label className={label}>SKU</label>
          <input className={input} value={form.sku} onChange={(e) => set("sku", e.target.value)} />
        </div>
        <div>
          <label className={label}>Category</label>
          <select className={input} value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
            <option value="">— None —</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Brand</label>
          <select className={input} value={form.brandId} onChange={(e) => set("brandId", e.target.value)}>
            <option value="">— None —</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Base Price ($)</label>
          <input className={input} type="number" step="0.01" value={form.basePrice} onChange={(e) => set("basePrice", e.target.value)} />
        </div>
        <div>
          <label className={label}>Wholesale Price ($)</label>
          <input className={input} type="number" step="0.01" value={form.wholesalePrice} onChange={(e) => set("wholesalePrice", e.target.value)} />
        </div>
        <div>
          <label className={label}>Stock Level</label>
          <input className={input} type="number" value={form.stockLevel} onChange={(e) => set("stockLevel", e.target.value)} />
        </div>
        <div>
          <label className={label}>Image URL (real product photo)</label>
          <input className={input} placeholder="https://… or /products/sku.jpg" value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} />
        </div>
      </div>

      <div>
        <label className={label}>Description</label>
        <textarea className={input} rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input type="checkbox" checked={form.isAgeRestricted} onChange={(e) => set("isAgeRestricted", e.target.checked)} />
          21+ Age Restricted
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} />
          Active (visible in store)
        </label>
        <div>
          <label className={label}>Restriction Type</label>
          <select className={input} value={form.restrictedProductType} onChange={(e) => set("restrictedProductType", e.target.value)}>
            <option value="none">none</option>
            <option value="tobacco">tobacco</option>
            <option value="nicotine_vape">nicotine_vape</option>
            <option value="smoking_accessory">smoking_accessory</option>
          </select>
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-500/15 p-3 text-sm text-red-400">{error}</div>}

      <button type="submit" disabled={saving} className="btn-premium rounded-xl px-6 py-3 text-sm font-bold disabled:opacity-50">
        {saving ? "Saving…" : productId ? "Save Changes" : "Create Product"}
      </button>
    </form>
  );
}
