import { StorageGrid } from "@/components/dashboard/media/storage/StorageGrid";
import { UploadToast } from "@/components/dashboard/media/storage/UploadToast";
import { useMediaSelection } from "@/lib/hooks/useMediaSelection";
import { StorageCategory, useMediaStorage } from "@/lib/hooks/useMediaStorage";
import { useMediaUpload } from "@/lib/hooks/useMediaUpload";
import { Button } from "@c3/ui/components/button";
import { Tabs, TabsTrigger, TabsList } from "@c3/ui/components/tabs";
import {
  Upload,
  Trash2,
  Download,
  X,
  CheckSquare,
  MousePointer2,
} from "lucide-react";
import { useRef, useState } from "react";
import { StorageLightbox } from "./StorageLightbox";
import { MediaGridSkeleton } from "../MediaGridSkeleton";
import { MediaTab } from "../types";

export function StorageTabContent({
  active,
  onChangeTab,
}: {
  active: StorageCategory;
  onChangeTab: (tab: MediaTab) => void;
}) {
  const { items, isLoading, mutate } = useMediaStorage(active);
  const { uploads, uploadFiles, dismissUpload } = useMediaUpload(mutate);
  const {
    selectMode,
    setSelectMode,
    selected,
    toggleSelect,
    selectAll,
    clearSelection,
  } = useMediaSelection(items.map((i) => i.name));
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadSelected = () => {
    items
      .filter((i) => selected.has(i.name))
      .forEach((item) => {
        const a = document.createElement("a");
        a.href = item.url;
        a.download = item.name;
        a.target = "_blank";
        a.click();
      });
  };

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    setDeleting(true);
    await Promise.all(
      Array.from(selected).map((fileName) =>
        fetch("/api/media", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category: active, fileName }),
        }),
      ),
    );
    clearSelection();
    mutate();
    setDeleting(false);
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Tabs value={active} onValueChange={(v) => onChangeTab(v as MediaTab)}>
          <TabsList>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="companies">Companies</TabsTrigger>
            <TabsTrigger value="panelists">Panelists</TabsTrigger>
            <TabsTrigger value="instagram">Instagram</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button size="sm" onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-3.5 w-3.5" />
          Upload
        </Button>
      </div>

      {!isLoading && items.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {!selectMode ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectMode(true)}
            >
              <MousePointer2 className="h-3.5 w-3.5" />
              Select
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={selectAll}>
                <CheckSquare className="h-3.5 w-3.5" />
                Select all
              </Button>
              {selected.size > 0 && (
                <>
                  <span className="text-sm text-muted-foreground">
                    {selected.size} selected
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadSelected}
                  >
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
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                <X className="h-3.5 w-3.5" />
                Cancel
              </Button>
            </>
          )}
        </div>
      )}

      {isLoading ? (
        <MediaGridSkeleton />
      ) : (
        <StorageGrid
          items={items}
          selectMode={selectMode}
          selected={selected}
          onToggle={toggleSelect}
          onOpen={setLightbox}
          onDrop={uploadFiles}
          category={active}
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
            uploadFiles(e.target.files, active);
            e.target.value = "";
          }
        }}
      />

      {lightbox !== null && (
        <StorageLightbox
          items={items}
          startIndex={lightbox}
          onClose={() => setLightbox(null)}
        />
      )}

      <UploadToast entries={uploads} onDismiss={dismissUpload} />
    </>
  );
}
