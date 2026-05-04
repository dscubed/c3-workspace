"use client";

import Image from "next/image";
import type { InstagramImage } from "@/lib/hooks/dashboard/media/useInstagramMedia";
import { Lightbox } from "@/components/dashboard/media/Lightbox";

interface IgLightboxProps {
  items: InstagramImage[];
  startIndex: number;
  onClose: () => void;
}

export function IgLightbox({ items, startIndex, onClose }: IgLightboxProps) {
  return (
    <Lightbox
      total={items.length}
      startIndex={startIndex}
      onClose={onClose}
      className="flex-col"
    >
      {(idx) => (
        <div
          className="relative w-full max-w-2xl mx-16"
          style={{ aspectRatio: "1" }}
          onClick={(e) => e.stopPropagation()}
        >
          <Image
            src={items[idx].image_url}
            alt="Instagram"
            fill
            className="object-contain"
            unoptimized
          />
        </div>
      )}
    </Lightbox>
  );
}
