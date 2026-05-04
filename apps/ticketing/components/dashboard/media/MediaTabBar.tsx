"use client";

import { cn } from "@/lib/utils";
import { useMediaTab } from "./MediaTabContext";
import { MediaTab, VALID_TABS } from "./types";

const TAB_LABELS: Record<MediaTab, string> = {
  images: "Images",
  companies: "Companies",
  panelists: "Panelists",
  instagram: "Instagram",
};

export function MediaTabBar({ children }: { children?: React.ReactNode }) {
  const { active, changeTab } = useMediaTab();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {VALID_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => changeTab(tab)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-150",
              active === tab
                ? "bg-[#854ECB] text-white"
                : "bg-gray-100 text-muted-foreground hover:bg-gray-200 hover:text-black",
            )}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}
