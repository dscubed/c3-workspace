"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SortableList, SortableItem } from "@/components/ui/sortable-list";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WhatToBringSectionData } from "@c3/types";

interface WhatToBringSectionCardProps {
  data: WhatToBringSectionData;
  onChange: (data: WhatToBringSectionData) => void;
  isDark?: boolean;
}

export function WhatToBringSectionCard({
  data,
  onChange,
  isDark,
}: WhatToBringSectionCardProps) {
  const updateItem = (index: number, value: string) => {
    const items = [...data.items];
    items[index] = { item: value };
    onChange({ ...data, items });
  };

  const addItem = () => {
    onChange({ ...data, items: [...data.items, { item: "" }] });
  };

  const removeItem = (index: number) => {
    if (data.items.length <= 1) return;
    onChange({ ...data, items: data.items.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-3">
      <SortableList
        items={data.items}
        idPrefix="bring"
        onReorder={(items) => onChange({ ...data, items })}
        className="space-y-3"
      >
        {(item, index, id) => (
          <SortableItem id={id} className="group flex items-center gap-2">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/30 text-[10px] font-bold text-muted-foreground">
              {index + 1}
            </div>
            <Input
              placeholder="Item to bring..."
              value={item.item}
              onChange={(e) => updateItem(index, e.target.value)}
              className={cn(
                "flex-1",
                isDark &&
                  "border-neutral-600 bg-neutral-700 text-neutral-100 placeholder:text-neutral-400",
              )}
            />
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
        Add Item
      </Button>
    </div>
  );
}
