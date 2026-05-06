"use client";

import { useState } from "react";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Building2, Mic, Instagram, ImageIcon } from "lucide-react";
import { useAuthStore, useClubStore } from "@c3/auth";
import { type StorageCategory } from "@/lib/hooks/dashboard/media/useMediaStorage";
import { LibraryInstagramContent } from "./tabs/LibraryInstagramContent";
import { LibraryStorageContent } from "./tabs/LibraryStorageContent";

export type MediaCategory = "images" | "companies" | "panelists" | "instagram";

interface MediaLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: MediaCategory;
  multiSelect?: boolean;
  onSelect: (urls: string[]) => void;
  clubId?: string;
}

const TAB_META: {
  value: MediaCategory;
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
}[] = [
  { value: "images", label: "Images", icon: <ImageIcon className="h-4 w-4" /> },
  {
    value: "companies",
    label: "Companies",
    icon: <Building2 className="h-4 w-4" />,
  },
  {
    value: "panelists",
    label: "Panelists",
    icon: <Mic className="h-4 w-4" />,
  },
  {
    value: "instagram",
    label: "Instagram",
    icon: <Instagram className="h-4 w-4" />,
  },
];

export function MediaLibraryDialog({
  open,
  onOpenChange,
  defaultTab = "images",
  multiSelect = false,
  onSelect,
  clubId,
}: MediaLibraryDialogProps) {
  const [activeTab, setActiveTab] = useState<MediaCategory>(defaultTab);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { user, isOrganisation } = useAuthStore();
  const isOrg = isOrganisation();
  const { activeClubId, clubsLoading } = useClubStore();

  const effectiveClubId = clubId ?? (isOrg ? (user?.id ?? null) : activeClubId);

  const storageCategory = (
    activeTab === "instagram" ? "images" : activeTab
  ) as StorageCategory;

  const handleSelect = (url: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(url)) {
        next.delete(url);
      } else {
        if (!multiSelect) next.clear();
        next.add(url);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    onSelect(Array.from(selected));
    onOpenChange(false);
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="Media Library"
      description="Upload and manage your media assets"
      className="max-w-2xl"
    >
      <div className="flex flex-col gap-4" key={`${open}-${defaultTab}`}>
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as MediaCategory)}
        >
          <TabsList className="w-full">
            {TAB_META.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                disabled={tab.disabled}
                className={cn("flex-1 gap-1.5", tab.disabled && "opacity-40")}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="instagram">
            <LibraryInstagramContent
              selected={selected}
              onSelect={handleSelect}
              clubId={effectiveClubId}
              clubsLoading={clubsLoading}
            />
          </TabsContent>

          {(["images", "companies", "panelists"] as MediaCategory[]).map(
            (cat) => (
              <TabsContent key={cat} value={cat}>
                <LibraryStorageContent
                  activeTab={cat}
                  storageCategory={storageCategory}
                  selected={selected}
                  onSelect={handleSelect}
                />
              </TabsContent>
            ),
          )}
        </Tabs>

        <div className="flex items-center justify-end gap-2 border-t pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={selected.size === 0}
            onClick={handleConfirm}
          >
            {selected.size > 0
              ? `Select ${selected.size} file${selected.size > 1 ? "s" : ""}`
              : "Select"}
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
