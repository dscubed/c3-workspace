import { Button } from "@c3/ui/components/button";
import { Download, Trash2, X, CheckSquare, MousePointer2 } from "lucide-react";
import { useStorageSelectionContext } from "./StorageSelectionContext";

export function SelectionActionBar() {
  const {
    selectMode,
    setSelectMode,
    selected,
    selectAll,
    clearSelection,
    downloadSelected,
    deleteSelected,
    deleting,
  } = useStorageSelectionContext();

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {!selectMode ? (
        <Button variant="outline" size="sm" onClick={() => setSelectMode(true)}>
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
          <Button variant="ghost" size="sm" onClick={clearSelection}>
            <X className="h-3.5 w-3.5" />
            Cancel
          </Button>
        </>
      )}
    </div>
  );
}
