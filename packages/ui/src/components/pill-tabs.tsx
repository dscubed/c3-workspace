"use client";

import * as React from "react";
import { cn } from "@c3/utils";

export interface PillTab<T extends string = string> {
  label: React.ReactNode;
  value: T;
}

export interface PillTabsProps<T extends string = string> {
  tabs: PillTab<T>[];
  value: T;
  onValueChange: (value: T) => void;
  className?: string;
}

export function PillTabs<T extends string = string>({
  tabs,
  value,
  onValueChange,
  className,
}: PillTabsProps<T>) {
  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onValueChange(tab.value)}
          className={cn(
            "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-150",
            value === tab.value
              ? "bg-[#854ECB] text-white"
              : "bg-gray-100 text-muted-foreground hover:bg-gray-200 hover:text-black",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
