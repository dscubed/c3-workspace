"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SortableList, SortableItem } from "@/components/ui/sortable-list";
import { Plus, Trash2, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PanelistsSectionData, Panelist } from "@c3/types";
import { MediaLibraryDialog } from "@/components/media/MediaLibraryDialog";

interface PanelistsSectionCardProps {
  data: PanelistsSectionData;
  onChange: (data: PanelistsSectionData) => void;
  isDark?: boolean;
}

export function PanelistsSectionCard({
  data,
  onChange,
  isDark,
}: PanelistsSectionCardProps) {
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
  const [mediaPickIndex, setMediaPickIndex] = useState<number | null>(null);

  const updateItem = (index: number, partial: Partial<Panelist>) => {
    const items = [...data.items];
    items[index] = { ...items[index], ...partial };
    onChange({ ...data, items });
  };

  const addItem = () => {
    onChange({
      ...data,
      items: [...data.items, { name: "", title: "", imageUrl: "" }],
    });
  };

  const removeItem = (index: number) => {
    if (data.items.length <= 1) return;
    onChange({ ...data, items: data.items.filter((_, i) => i !== index) });
  };

  const handleMediaPick = (index: number) => {
    setMediaPickIndex(index);
    setMediaLibraryOpen(true);
  };

  const handleMediaSelect = (urls: string[]) => {
    if (urls.length > 0 && mediaPickIndex !== null) {
      updateItem(mediaPickIndex, { imageUrl: urls[0] });
    }
    setMediaPickIndex(null);
  };

  const inputDark = isDark
    ? "border-neutral-600 bg-neutral-700 text-neutral-100 placeholder:text-neutral-400"
    : "";

  return (
    <div className="space-y-4">
      <SortableList
        items={data.items}
        idPrefix="panelist"
        onReorder={(items) => onChange({ ...data, items })}
        className="space-y-4"
      >
        {(item, index, id) => (
          <SortableItem
            id={id}
            className={cn(
              "group flex items-center gap-3 rounded-lg border p-3",
              isDark && "border-neutral-600 bg-neutral-700",
            )}
          >
            <button
              type="button"
              onClick={() => handleMediaPick(index)}
              className="shrink-0"
            >
              <Avatar className="h-12 w-12 cursor-pointer transition-opacity hover:opacity-80">
                {item.imageUrl ? (
                  <AvatarImage src={item.imageUrl} alt={item.name} />
                ) : null}
                <AvatarFallback
                  className={cn("bg-muted", isDark && "bg-neutral-600")}
                >
                  <ImagePlus
                    className={cn(
                      "h-5 w-5 text-muted-foreground",
                      isDark && "text-neutral-400",
                    )}
                  />
                </AvatarFallback>
              </Avatar>
            </button>

            <div className="flex flex-1 flex-col gap-1.5">
              <Input
                placeholder="Name"
                value={item.name}
                onChange={(e) => updateItem(index, { name: e.target.value })}
                className={cn("h-8 text-sm font-medium", inputDark)}
              />
              <Input
                placeholder="Title / Role"
                value={item.title}
                onChange={(e) => updateItem(index, { title: e.target.value })}
                className={cn("h-8 text-sm", inputDark)}
              />
            </div>

            {data.items.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeItem(index)}
                className="h-8 w-8 shrink-0 p-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </SortableItem>
        )}
      </SortableList>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addItem}
        className={cn(
          "w-full gap-1",
          isDark &&
            "border-neutral-600 text-neutral-300 hover:bg-neutral-700 hover:text-white",
        )}
      >
        <Plus className="h-4 w-4" />
        Add Panelist
      </Button>

      <MediaLibraryDialog
        open={mediaLibraryOpen}
        onOpenChange={setMediaLibraryOpen}
        defaultTab="panelists"
        onSelect={handleMediaSelect}
      />
    </div>
  );
}
