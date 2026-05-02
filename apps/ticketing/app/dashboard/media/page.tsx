"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Image as ImageIcon,
  Upload,
  Trash2,
  Download,
  Check,
  X,
  CheckSquare,
  MousePointer2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@c3/auth";
import { useAdminClubSelector } from "@/lib/hooks/useAdminClubSelector";
import { AdminClubSelector } from "@/components/dashboard/AdminClubSelector";
import { cn } from "@c3/utils";

type StorageCategory = "images" | "companies" | "panelists";
type MediaTab = StorageCategory | "instagram";
const VALID_TABS: MediaTab[] = ["images", "companies", "panelists", "instagram"];

interface StorageItem {
  name: string;
  url: string;
  created_at: string;
}

interface InstagramImage {
  post_id: string;
  image_url: string;
  caption: string;
  posted_by: string;
}

interface UploadEntry {
  id: string;
  fileName: string;
  progress: number;
  status: "uploading" | "done" | "error";
}

const isImage = (url: string) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
const isVideo = (url: string) => /\.(mp4|webm|mov)$/i.test(url);

/* ── Upload progress toasts ── */
function UploadToast({ entries, onDismiss }: { entries: UploadEntry[]; onDismiss: (id: string) => void }) {
  if (entries.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-72">
      {entries.map((e) => (
        <div key={e.id} className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-foreground truncate flex-1">{e.fileName}</p>
            {e.status !== "uploading" && (
              <button onClick={() => onDismiss(e.id)} className="shrink-0 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                e.status === "error" ? "bg-red-500" : e.status === "done" ? "bg-green-500" : "bg-[#854ECB]",
              )}
              style={{ width: `${e.progress}%` }}
            />
          </div>
          <p className={cn("text-[10px] font-medium",
            e.status === "error" ? "text-red-500" : e.status === "done" ? "text-green-600" : "text-muted-foreground",
          )}>
            {e.status === "error" ? "Upload failed" : e.status === "done" ? "Uploaded" : `${e.progress}%`}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ── Storage lightbox ── */
function StorageLightbox({ items, startIndex, onClose }: { items: StorageItem[]; startIndex: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIndex);
  const item = items[idx];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setIdx((i) => Math.min(items.length - 1, i + 1));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [items.length, onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={onClose}>
      <button className="absolute top-4 right-4 text-white/70 hover:text-white" onClick={onClose}>
        <X className="h-6 w-6" />
      </button>

      {idx > 0 && (
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-2"
          onClick={(e) => { e.stopPropagation(); setIdx((i) => i - 1); }}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      <div className="relative max-w-4xl max-h-[85vh] w-full h-full mx-16" onClick={(e) => e.stopPropagation()}>
        {isImage(item.url) ? (
          <Image src={item.url} alt={item.name} fill className="object-contain" unoptimized />
        ) : isVideo(item.url) ? (
          <video src={item.url} controls className="w-full h-full object-contain" />
        ) : null}
      </div>

      {idx < items.length - 1 && (
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-2"
          onClick={(e) => { e.stopPropagation(); setIdx((i) => i + 1); }}
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

/* ── Instagram lightbox ── */
function IgLightbox({ items, startIndex, onClose }: { items: InstagramImage[]; startIndex: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIndex);
  const item = items[idx];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setIdx((i) => Math.min(items.length - 1, i + 1));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [items.length, onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center" onClick={onClose}>
      <button className="absolute top-4 right-4 text-white/70 hover:text-white z-10" onClick={onClose}>
        <X className="h-6 w-6" />
      </button>

      {idx > 0 && (
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 z-10"
          onClick={(e) => { e.stopPropagation(); setIdx((i) => i - 1); }}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      <div
        className="relative w-full max-w-2xl mx-16"
        style={{ aspectRatio: "1" }}
        onClick={(e) => e.stopPropagation()}
      >
        <Image src={item.image_url} alt="Instagram" fill className="object-contain" unoptimized />
      </div>

      {idx < items.length - 1 && (
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 z-10"
          onClick={(e) => { e.stopPropagation(); setIdx((i) => i + 1); }}
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

/* ── Storage grid ── */
function StorageGrid({
  items,
  selectMode,
  selected,
  onToggle,
  onOpen,
  onDrop,
  category,
}: {
  items: StorageItem[];
  selectMode: boolean;
  selected: Set<string>;
  onToggle: (name: string) => void;
  onOpen: (index: number) => void;
  onDrop: (files: FileList, category: StorageCategory) => void;
  category: StorageCategory;
}) {
  const [dragging, setDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
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
          <Upload className={cn("h-10 w-10", dragging ? "text-[#854ECB]" : "opacity-30")} />
          <p className="text-sm">{dragging ? "Drop files here" : "No media yet — drag & drop to upload"}</p>
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
        dragging && "outline-dashed outline-2 outline-[#854ECB] bg-purple-50/50",
      )}
    >
      {items.map((item, i) => {
        const sel = selected.has(item.name);
        return (
          <div
            key={item.name}
            onClick={() => selectMode ? onToggle(item.name) : onOpen(i)}
            className={cn(
              "group relative aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 cursor-pointer transition-all",
              selectMode && sel ? "border-[#854ECB] shadow-md" : "border-transparent hover:border-gray-300",
            )}
          >
            {isImage(item.url) ? (
              <Image src={item.url} alt={item.name} fill className="object-cover" unoptimized />
            ) : isVideo(item.url) ? (
              <video src={item.url} className="w-full h-full object-cover" controls={false} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-gray-400" />
              </div>
            )}

            {selectMode && (
              <>
                <div className={cn("absolute inset-0 transition-colors", sel ? "bg-[#854ECB]/20" : "bg-black/0 group-hover:bg-black/10")} />
                <div className={cn(
                  "absolute top-2 right-2 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all",
                  sel ? "bg-[#854ECB] border-[#854ECB]" : "bg-white/80 border-gray-300 opacity-0 group-hover:opacity-100",
                )}>
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

export default function MediaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isOrganisation } = useAuthStore();
  const isOrg = isOrganisation();
  const { clubs, selectedClubId, setSelectedClubId, loading: clubsLoading } = useAdminClubSelector();
  const effectiveClubId = isOrg ? (user?.id ?? null) : selectedClubId;

  const rawTab = searchParams.get("tab") as MediaTab | null;
  const [active, setActive] = useState<MediaTab>(
    rawTab && VALID_TABS.includes(rawTab) ? rawTab : "images",
  );

  const [storageItems, setStorageItems] = useState<StorageItem[]>([]);
  const [igImages, setIgImages] = useState<InstagramImage[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [storageLightbox, setStorageLightbox] = useState<number | null>(null);
  const [igLightbox, setIgLightbox] = useState<number | null>(null);
  const [uploads, setUploads] = useState<UploadEntry[]>([]);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const changeTab = (tab: MediaTab) => {
    setActive(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const fetchStorage = useCallback(async (cat: StorageCategory) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/media?category=${cat}`);
      if (!res.ok) throw new Error();
      const { data } = await res.json();
      setStorageItems(data || []);
    } catch {
      setStorageItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSelected(new Set());
    setSelectMode(false);
    if (active === "instagram") {
      if (!effectiveClubId) return;
      setLoading(true);
      fetch(`/api/media/instagram?club_id=${effectiveClubId}`)
        .then((r) => r.json())
        .then(({ data }) => setIgImages(data || []))
        .catch(() => setIgImages([]))
        .finally(() => setLoading(false));
    } else {
      fetchStorage(active as StorageCategory);
    }
  }, [active, effectiveClubId, fetchStorage]);

  const uploadFiles = useCallback(async (files: FileList, category: StorageCategory) => {
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
            setUploads((prev) => prev.map((u) => u.id === entry.id ? { ...u, progress: pct } : u));
          };
          xhr.onload = () => {
            const ok = xhr.status >= 200 && xhr.status < 300;
            setUploads((prev) => prev.map((u) => u.id === entry.id ? { ...u, progress: 100, status: ok ? "done" : "error" } : u));
            if (ok) setTimeout(() => setUploads((prev) => prev.filter((u) => u.id !== entry.id)), 3000);
            resolve();
          };
          xhr.onerror = () => {
            setUploads((prev) => prev.map((u) => u.id === entry.id ? { ...u, status: "error" } : u));
            resolve();
          };
          xhr.open("POST", "/api/media");
          xhr.send(formData);
        });
      }),
    );

    fetchStorage(category);
  }, [fetchStorage]);

  const toggleSelect = (name: string) =>
    setSelected((prev) => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n; });

  const deleteSelected = async () => {
    if (selected.size === 0 || active === "instagram") return;
    setDeleting(true);
    await Promise.all(
      Array.from(selected).map((fileName) =>
        fetch("/api/media", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category: active, fileName }) }),
      ),
    );
    setSelected(new Set());
    setSelectMode(false);
    fetchStorage(active as StorageCategory);
    setDeleting(false);
  };

  const downloadSelected = () => {
    storageItems.filter((i) => selected.has(i.name)).forEach((item) => {
      const a = document.createElement("a");
      a.href = item.url;
      a.download = item.name;
      a.target = "_blank";
      a.click();
    });
  };

  const isStorageTab = active !== "instagram";
  const isSpinning = loading || (active === "instagram" && clubsLoading);
  const isEmpty = active === "instagram" ? igImages.length === 0 : storageItems.length === 0;

  return (
    <div className="p-4 sm:p-8 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">Media</h1>
        {!isOrg && (
          <AdminClubSelector
            clubs={clubs}
            selectedClubId={selectedClubId}
            onSelect={setSelectedClubId}
          />
        )}
      </div>

      {/* Tabs row + actions row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Tabs value={active} onValueChange={(v) => changeTab(v as MediaTab)}>
          <TabsList>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="companies">Companies</TabsTrigger>
            <TabsTrigger value="panelists">Panelists</TabsTrigger>
            <TabsTrigger value="instagram">Instagram</TabsTrigger>
          </TabsList>
        </Tabs>

        {isStorageTab && (
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-3.5 w-3.5" />
              Upload
            </Button>
          </div>
        )}
      </div>

      {/* Selection action bar — below tabs */}
      {isStorageTab && !isSpinning && !isEmpty && (
        <div className="flex items-center gap-2 flex-wrap">
          {!selectMode ? (
            <Button variant="outline" size="sm" onClick={() => setSelectMode(true)}>
              <MousePointer2 className="h-3.5 w-3.5" />
              Select
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setSelected(new Set(storageItems.map((i) => i.name)))}>
                <CheckSquare className="h-3.5 w-3.5" />
                Select all
              </Button>
              {selected.size > 0 && (
                <>
                  <span className="text-sm text-muted-foreground">{selected.size} selected</span>
                  <Button variant="outline" size="sm" onClick={downloadSelected}>
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={deleteSelected}
                    disabled={deleting}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {deleting ? "Deleting..." : "Delete"}
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm" onClick={() => { setSelectMode(false); setSelected(new Set()); }}>
                <X className="h-3.5 w-3.5" />
                Cancel
              </Button>
            </>
          )}
        </div>
      )}

      {/* Grid */}
      {isSpinning ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-lg" />
          ))}
        </div>
      ) : active === "instagram" ? (
        isEmpty ? (
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
              <ImageIcon className="h-10 w-10 opacity-30" />
              <p className="text-sm">No Instagram media</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {igImages.map((item, i) => (
              <div
                key={`${item.post_id}-${i}`}
                onClick={() => setIgLightbox(i)}
                className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200 cursor-pointer hover:border-gray-300 transition-all"
              >
                <Image src={item.image_url} alt="Instagram" fill className="object-cover hover:scale-105 transition-transform" unoptimized />
              </div>
            ))}
          </div>
        )
      ) : (
        <StorageGrid
          items={storageItems}
          selectMode={selectMode}
          selected={selected}
          onToggle={toggleSelect}
          onOpen={(i) => setStorageLightbox(i)}
          onDrop={uploadFiles}
          category={active as StorageCategory}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) {
            uploadFiles(e.target.files, active as StorageCategory);
            e.target.value = "";
          }
        }}
      />

      {storageLightbox !== null && (
        <StorageLightbox
          items={storageItems}
          startIndex={storageLightbox}
          onClose={() => setStorageLightbox(null)}
        />
      )}

      {igLightbox !== null && (
        <IgLightbox
          items={igImages}
          startIndex={igLightbox}
          onClose={() => setIgLightbox(null)}
        />
      )}

      <UploadToast
        entries={uploads}
        onDismiss={(id) => setUploads((prev) => prev.filter((u) => u.id !== id))}
      />
    </div>
  );
}
