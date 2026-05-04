import { StorageGrid } from "@/components/dashboard/media/storage/StorageGrid";
import { UploadToast } from "@/components/dashboard/media/storage/UploadToast";
import { SelectionActionBar } from "@/components/dashboard/media/storage/SelectionActionBar";
import { StorageSelectionContext } from "@/components/dashboard/media/storage/StorageSelectionContext";
import { useStorageSelection } from "@/lib/hooks/dashboard/media/useStorageSelection";
import {
  StorageCategory,
  useMediaStorage,
} from "@/lib/hooks/dashboard/media/useMediaStorage";
import { useMediaUpload } from "@/lib/hooks/dashboard/media/useMediaUpload";
import { Button } from "@c3/ui/components/button";
import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { StorageLightbox } from "./StorageLightbox";
import { MediaGridSkeleton } from "../MediaGridSkeleton";
import { MediaTabBar } from "../MediaTabBar";

export function StorageTabContent({ active }: { active: StorageCategory }) {
  const { items, isLoading, mutate } = useMediaStorage(active);
  const { uploads, uploadFiles, dismissUpload } = useMediaUpload(mutate);
  const selection = useStorageSelection(items, active, mutate);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <StorageSelectionContext.Provider value={selection}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <MediaTabBar />
        <Button size="sm" onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-3.5 w-3.5" />
          Upload
        </Button>
      </div>

      {!isLoading && items.length > 0 && <SelectionActionBar />}

      {isLoading ? (
        <MediaGridSkeleton />
      ) : (
        <StorageGrid
          items={items}
          selectMode={selection.selectMode}
          selected={selection.selected}
          onToggle={selection.toggleSelect}
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
    </StorageSelectionContext.Provider>
  );
}
