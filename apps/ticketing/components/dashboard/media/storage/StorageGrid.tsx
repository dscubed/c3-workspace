"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, Image as ImageIcon, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StorageCategory, StorageItem } from "@/lib/hooks/useMediaStorage";

const isImage = (url: string) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
const isVideo = (url: string) => /\.(mp4|webm|mov)$/i.test(url);

interface StorageGridProps {
  items: StorageItem[];
  selectMode: boolean;
  selected: Set<string>;
  onToggle: (name: string) => void;
  onOpen: (index: number) => void;
  onDrop: (files: FileList, category: StorageCategory) => void;
  category: StorageCategory;
}

export function StorageGrid({
  items,
  selectMode,
  selected,
  onToggle,
  onOpen,
  onDrop,
  category,
}: StorageGridProps) {
  const [dragging, setDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };
  const handleDragLeave = () => setDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) onDrop(e.dataTransfer.files, category);
  };

  if (items.length === 0) {
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "rounded-xl border-2 border-dashed bg-white transition-colors",
          dragging ? "border-[#854ECB] bg-purple-50" : "border-gray-200",
        )}
      >
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
          <Upload
            className={cn(
              "h-10 w-10",
              dragging ? "text-[#854ECB]" : "opacity-30",
            )}
          />
          <p className="text-sm">
            {dragging
              ? "Drop files here"
              : "No media yet — drag & drop to upload"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 rounded-xl transition-colors p-1",
        dragging &&
          "outline-dashed outline-2 outline-[#854ECB] bg-purple-50/50",
      )}
    >
      {items.map((item, i) => {
        const sel = selected.has(item.name);
        return (
          <div
            key={item.name}
            onClick={() => (selectMode ? onToggle(item.name) : onOpen(i))}
            className={cn(
              "group relative aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 cursor-pointer transition-all",
              selectMode && sel
                ? "border-[#854ECB] shadow-md"
                : "border-transparent hover:border-gray-300",
            )}
          >
            {isImage(item.url) ? (
              <Image
                src={item.url}
                alt={item.name}
                fill
                className="object-cover"
                unoptimized
              />
            ) : isVideo(item.url) ? (
              <video
                src={item.url}
                className="w-full h-full object-cover"
                controls={false}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-gray-400" />
              </div>
            )}

            {selectMode && (
              <>
                <div
                  className={cn(
                    "absolute inset-0 transition-colors",
                    sel
                      ? "bg-[#854ECB]/20"
                      : "bg-black/0 group-hover:bg-black/10",
                  )}
                />
                <div
                  className={cn(
                    "absolute top-2 right-2 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all",
                    sel
                      ? "bg-[#854ECB] border-[#854ECB]"
                      : "bg-white/80 border-gray-300 opacity-0 group-hover:opacity-100",
                  )}
                >
                  {sel && <Check className="h-3 w-3 text-white" />}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
