"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { StorageItem } from "@/lib/hooks/useMediaStorage";

const isImage = (url: string) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
const isVideo = (url: string) => /\.(mp4|webm|mov)$/i.test(url);

interface StorageLightboxProps {
  items: StorageItem[];
  startIndex: number;
  onClose: () => void;
}

export function StorageLightbox({
  items,
  startIndex,
  onClose,
}: StorageLightboxProps) {
  const [idx, setIdx] = useState(startIndex);
  const item = items[idx];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight")
        setIdx((i) => Math.min(items.length - 1, i + 1));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [items.length, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white/70 hover:text-white"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </button>

      {idx > 0 && (
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-2"
          onClick={(e) => {
            e.stopPropagation();
            setIdx((i) => i - 1);
          }}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      <div
        className="relative max-w-4xl max-h-[85vh] w-full h-full mx-16"
        onClick={(e) => e.stopPropagation()}
      >
        {isImage(item.url) ? (
          <Image
            src={item.url}
            alt={item.name}
            fill
            className="object-contain"
            unoptimized
          />
        ) : isVideo(item.url) ? (
          <video
            src={item.url}
            controls
            className="w-full h-full object-contain"
          />
        ) : null}
      </div>

      {idx < items.length - 1 && (
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-2"
          onClick={(e) => {
            e.stopPropagation();
            setIdx((i) => i + 1);
          }}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-xs">
        {idx + 1} / {items.length}
      </p>
    </div>
  );
}
