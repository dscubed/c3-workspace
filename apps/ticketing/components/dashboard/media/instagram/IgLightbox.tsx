"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { InstagramImage } from "@/lib/hooks/useInstagramMedia";

interface IgLightboxProps {
  items: InstagramImage[];
  startIndex: number;
  onClose: () => void;
}

export function IgLightbox({ items, startIndex, onClose }: IgLightboxProps) {
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
      className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white/70 hover:text-white z-10"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </button>

      {idx > 0 && (
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 z-10"
          onClick={(e) => {
            e.stopPropagation();
            setIdx((i) => i - 1);
          }}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      <div
        className="relative w-full max-w-2xl mx-16"
        style={{ aspectRatio: "1" }}
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={item.image_url}
          alt="Instagram"
          fill
          className="object-contain"
          unoptimized
        />
      </div>

      {idx < items.length - 1 && (
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 z-10"
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
