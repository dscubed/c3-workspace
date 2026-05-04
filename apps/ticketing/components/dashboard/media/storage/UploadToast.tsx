"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UploadEntry } from "@/lib/hooks/dashboard/media/useMediaUpload";

interface UploadToastProps {
  entries: UploadEntry[];
  onDismiss: (id: string) => void;
}

export function UploadToast({ entries, onDismiss }: UploadToastProps) {
  if (entries.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-72">
      {entries.map((e) => (
        <div
          key={e.id}
          className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 space-y-2"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-foreground truncate flex-1">
              {e.fileName}
            </p>
            {e.status !== "uploading" && (
              <button
                onClick={() => onDismiss(e.id)}
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                e.status === "error"
                  ? "bg-red-500"
                  : e.status === "done"
                    ? "bg-green-500"
                    : "bg-[#854ECB]",
              )}
              style={{ width: `${e.progress}%` }}
            />
          </div>
          <p
            className={cn(
              "text-[10px] font-medium",
              e.status === "error"
                ? "text-red-500"
                : e.status === "done"
                  ? "text-green-600"
                  : "text-muted-foreground",
            )}
          >
            {e.status === "error"
              ? "Upload failed"
              : e.status === "done"
                ? "Uploaded"
                : `${e.progress}%`}
          </p>
        </div>
      ))}
    </div>
  );
}
