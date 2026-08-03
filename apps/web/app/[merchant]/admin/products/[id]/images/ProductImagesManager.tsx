"use client";

import { useCallback, useEffect, useState } from "react";
import { Dropzone } from "./Dropzone";

type UploadState = {
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  progress?: number;
  url?: string;
  error?: string;
};

type Props = {
  productId: number;
  merchant: string;
};

export default function ProductImagesManager({ productId, merchant }: Props) {
  const [images, setImages] = useState<string[]>([]);
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [loading, setLoading] = useState(true);

  const endpoint = (extra = "") =>
    `/api/admin/products/${productId}/images${extra}?merchant=${encodeURIComponent(
      merchant
    )}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(endpoint());
      if (res.ok) {
        const data = await res.json();
        setImages(data.images ?? []);
      }
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, merchant]);

  useEffect(() => {
    load();
  }, [load]);

  const setUploadStatus = (idx: number, patch: Partial<UploadState>) =>
    setUploads((prev) => prev.map((u, i) => (i === idx ? { ...u, ...patch } : u)));

  const uploadOne = async (entry: UploadState, idx: number) => {
    setUploadStatus(idx, { status: "uploading", progress: 0 });
    try {
      const fd = new FormData();
      fd.append("file", entry.file);
      const res = await fetch(endpoint(), { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);
      setUploadStatus(idx, { status: "done", url: data.url, progress: 100 });
      setImages(data.images ?? []);
    } catch (e) {
      setUploadStatus(idx, {
        status: "error",
        error: e instanceof Error ? e.message : "Upload failed",
      });
    }
  };

  const handleFiles = (files: File[]) => {
    const next = files.map<UploadState>((file) => ({ file, status: "pending" }));
    setUploads((prev) => [...prev, ...next]);
    next.forEach((entry, offset) => {
      const idx = uploads.length + offset;
      void uploadOne(entry, idx);
    });
  };

  const remove = async (url: string) => {
    const res = await fetch(endpoint(`?url=${encodeURIComponent(url)}`), {
      method: "DELETE",
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      setImages(data.images ?? images.filter((u) => u !== url));
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-1 text-xl font-semibold text-gray-900">Product Photos</h1>
      <p className="mb-6 text-sm text-gray-500">
        Drag &amp; drop product images. They are stored per-tenant and attached to this
        product.
      </p>

      <Dropzone onFiles={handleFiles} disabled={loading} />

      {uploads.length > 0 && (
        <div className="mt-6 space-y-2">
          {uploads.map((u, i) => (
            <div
              key={`${u.file.name}-${i}`}
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <span className="truncate">{u.file.name}</span>
              <span className="ml-auto text-xs">
                {u.status === "uploading" && "Uploading…"}
                {u.status === "done" && (
                  <span className="text-green-600">Uploaded</span>
                )}
                {u.status === "error" && (
                  <span className="text-red-600">{u.error}</span>
                )}
                {u.status === "pending" && (
                  <span className="text-gray-400">Queued</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}

      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-gray-500">
        Current images ({images.length})
      </h2>
      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : images.length === 0 ? (
        <p className="text-sm text-gray-400">No images yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {images.map((url) => (
            <div
              key={url}
              className="group relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt="product"
                className="h-32 w-full object-cover"
              />
              <button
                type="button"
                onClick={() => remove(url)}
                className="absolute right-1 top-1 hidden rounded bg-red-600 px-2 py-1 text-xs text-white group-hover:block"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
