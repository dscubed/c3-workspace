"use client";

import { useState, useRef } from "react";
import { Loader2, ImagePlus, Upload, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { StorageCategory, StorageItem } from "@/lib/hooks/dashboard/media/useMediaStorage";
import { useMediaStorage } from "@/lib/hooks/dashboard/media/useMediaStorage";
import { useMediaUpload } from "@/lib/hooks/dashboard/media/useMediaUpload";

interface LibraryStorageContentProps {
  activeTab: string;
  storageCategory: StorageCategory;
  selected: Set<string>;
  onSelect: (url: string) => void;
}

export function LibraryStorageContent({
  activeTab,
  storageCategory,
  selected,
  onSelect,
}: LibraryStorageContentProps) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaScrollRef = useRef<HTMLDivElement>(null);

  const { items, isLoading, mutate } = useMediaStorage(
    storageCategory,
    mediaScrollRef,
  );
  const { uploads, uploadFiles } = useMediaUpload(mutate);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    e.target.value = "";
    await uploadFiles(files, storageCategory);
  };

  const handleDelete = async (item: StorageItem) => {
    setDeleting(item.name);
    try {
      const res = await fetch("/api/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: storageCategory,
          fileName: item.name,
        }),
      });

      if (res.ok) {
        mutate();
      } else {
        console.error("[MediaLib] delete error:", res.status);
      }
    } catch (err) {
      console.error("[MediaLib] delete error:", err);
    } finally {
      setDeleting(null);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleUpload}
      />

      <div className="flex items-center justify-between gap-2 pb-3">
        <p className="text-sm text-muted-foreground">
          {items.length} file{items.length !== 1 ? "s" : ""}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={uploads.length > 0}
          onClick={triggerFileInput}
        >
          {uploads.length > 0 ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          Upload
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <ImagePlus className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              No {activeTab} uploaded yet
            </p>
            <p className="text-xs text-muted-foreground/60">
              Upload files to build your media library
            </p>
          </div>
        </div>
      ) : (
        <div
          ref={mediaScrollRef}
          className="grid grid-cols-3 gap-2 sm:grid-cols-4 max-h-[50vh] overflow-y-auto pr-1"
        >
          {items.map((item: StorageItem) => {
            const isSelected = selected.has(item.url);
            const isDel = deleting === item.name;
            return (
              <div
                key={item.name}
                className={cn(
                  "group relative aspect-square overflow-hidden rounded-lg border-2 cursor-pointer transition-all",
                  isSelected
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-transparent hover:border-muted-foreground/30",
                )}
                onClick={() => onSelect(item.url)}
              >
                <Image
                  src={item.url}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="150px"
                />

                {isSelected && (
                  <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                    <div className="rounded-full bg-primary p-1">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  className="absolute top-1 right-1 rounded-md bg-black/60 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item);
                  }}
                  disabled={isDel}
                >
                  {isDel ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5 text-white" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {uploads.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploads.map((up) => (
            <div
              key={up.id}
              className="flex items-center gap-2 rounded-md bg-muted p-2 text-sm"
            >
              <div className="flex-1">
                <p className="truncate">{up.fileName}</p>
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted-foreground/20">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${up.progress}%` }}
                  />
                </div>
              </div>
              {up.status === "error" && (
                <span className="text-xs text-destructive">Error</span>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
