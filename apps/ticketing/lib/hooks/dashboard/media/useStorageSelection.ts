"use client";

import { useState } from "react";
import type { StorageCategory, StorageItem } from "./useMediaStorage";

export function useStorageSelection(
  items: StorageItem[],
  category: StorageCategory,
  mutate: () => void,
) {
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const toggleSelect = (name: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });

  const selectAll = () => setSelected(new Set(items.map((i) => i.name)));

  const clearSelection = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

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
          body: JSON.stringify({ category, fileName }),
        }),
      ),
    );
    clearSelection();
    mutate();
    setDeleting(false);
  };

  return {
    selectMode,
    setSelectMode,
    selected,
    toggleSelect,
    selectAll,
    clearSelection,
    downloadSelected,
    deleteSelected,
    deleting,
  };
}
