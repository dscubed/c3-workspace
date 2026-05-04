"use client";

import Image from "next/image";
import type { StorageItem } from "@/lib/hooks/dashboard/media/useMediaStorage";
import { Lightbox } from "@/components/dashboard/media/Lightbox";

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
  return (
    <Lightbox total={items.length} startIndex={startIndex} onClose={onClose}>
      {(idx) => {
        const item = items[idx];
        return (
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
        );
      }}
    </Lightbox>
  );
}
