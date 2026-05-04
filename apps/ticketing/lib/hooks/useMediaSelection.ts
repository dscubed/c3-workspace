"use client";

import { useState } from "react";

export function useMediaSelection(allNames: string[]) {
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = (name: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });

  const selectAll = () => setSelected(new Set(allNames));

  const clearSelection = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

  return {
    selectMode,
    setSelectMode,
    selected,
    toggleSelect,
    selectAll,
    clearSelection,
  };
}
