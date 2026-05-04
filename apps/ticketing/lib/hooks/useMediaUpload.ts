"use client";

import { useState } from "react";
import type { KeyedMutator } from "swr";
import type { StorageCategory, StorageItem } from "./useMediaStorage";

export interface UploadEntry {
  id: string;
  fileName: string;
  progress: number;
  status: "uploading" | "done" | "error";
}

export function useMediaUpload(mutate: KeyedMutator<{ data: StorageItem[] }>) {
  const [uploads, setUploads] = useState<UploadEntry[]>([]);

  const uploadFiles = async (files: FileList, category: StorageCategory) => {
    const entries: UploadEntry[] = Array.from(files).map((f) => ({
      id: `${Date.now()}-${Math.random()}`,
      fileName: f.name,
      progress: 0,
      status: "uploading" as const,
    }));
    setUploads((prev) => [...prev, ...entries]);

    await Promise.all(
      Array.from(files).map((file, i) => {
        const entry = entries[i];
        return new Promise<void>((resolve) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("category", category);

          const xhr = new XMLHttpRequest();
          xhr.upload.onprogress = (e) => {
            if (!e.lengthComputable) return;
            const pct = Math.round((e.loaded / e.total) * 100);
            setUploads((prev) =>
              prev.map((u) =>
                u.id === entry.id ? { ...u, progress: pct } : u,
              ),
            );
          };
          xhr.onload = () => {
            const ok = xhr.status >= 200 && xhr.status < 300;
            setUploads((prev) =>
              prev.map((u) =>
                u.id === entry.id
                  ? { ...u, progress: 100, status: ok ? "done" : "error" }
                  : u,
              ),
            );
            if (ok) {
              mutate();
              setTimeout(
                () =>
                  setUploads((prev) => prev.filter((u) => u.id !== entry.id)),
                3000,
              );
            }
            resolve();
          };
          xhr.onerror = () => {
            setUploads((prev) =>
              prev.map((u) =>
                u.id === entry.id ? { ...u, status: "error" } : u,
              ),
            );
            resolve();
          };
          xhr.open("POST", "/api/media");
          xhr.send(formData);
        });
      }),
    );
  };

  const dismissUpload = (id: string) =>
    setUploads((prev) => prev.filter((u) => u.id !== id));

  return { uploads, uploadFiles, dismissUpload };
}
