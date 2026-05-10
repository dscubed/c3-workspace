"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SortableList, SortableItem } from "@/components/ui/sortable-list";
import { Plus, Trash2, ImagePlus, ChevronDown, PenLine, Library } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompaniesSectionData, Company } from "@c3/types";
import { MediaLibraryDialog } from "@/components/media/MediaLibraryDialog";
import { BrowseCompaniesDialog } from "./BrowseCompaniesDialog";

interface CompaniesSectionCardProps {
  data: CompaniesSectionData;
  onChange: (data: CompaniesSectionData) => void;
  isDark?: boolean;
}

export function CompaniesSectionCard({
  data,
  onChange,
  isDark,
}: CompaniesSectionCardProps) {
  const [browseOpen, setBrowseOpen] = useState(false);
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
  const [mediaPickIndex, setMediaPickIndex] = useState<number | null>(null);

  const updateItem = (index: number, partial: Partial<Company>) => {
    const items = [...data.items];
    items[index] = { ...items[index], ...partial };
    onChange({ ...data, items });
  };

  const addCustomItem = () => {
    onChange({ ...data, items: [...data.items, { name: "", logoUrl: "" }] });
  };

  const addPresetCompanies = (companies: Company[]) => {
    const existingNames = new Set(data.items.map((c) => c.name.toLowerCase()));
    const newCompanies = companies.filter(
      (c) => !existingNames.has(c.name.toLowerCase()),
    );
    if (newCompanies.length === 0) return;
    const isSingleBlank =
      data.items.length === 1 && !data.items[0].name && !data.items[0].logoUrl;
    onChange({
      ...data,
      items: isSingleBlank ? newCompanies : [...data.items, ...newCompanies],
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
      updateItem(mediaPickIndex, { logoUrl: urls[0] });
    }
    setMediaPickIndex(null);
  };

  return (
    <div className="space-y-3">
      <SortableList
        items={data.items}
        idPrefix="company"
        onReorder={(items) => onChange({ ...data, items })}
        className="space-y-3"
      >
        {(item, index, id) => (
          <SortableItem
            id={id}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg border p-3",
              isDark && "border-neutral-600 bg-neutral-700",
            )}
          >
            <button
              type="button"
              onClick={() => handleMediaPick(index)}
              className="shrink-0"
            >
              <Avatar className="h-12 w-12 cursor-pointer rounded-lg transition-opacity hover:opacity-80">
                {item.logoUrl ? (
                  <AvatarImage
                    src={item.logoUrl}
                    alt={item.name}
                    className="rounded-lg object-contain"
                  />
                ) : null}
                <AvatarFallback
                  className={cn("rounded-lg bg-muted", isDark && "bg-neutral-600")}
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

            <Input
              placeholder="Company name"
              value={item.name}
              onChange={(e) => updateItem(index, { name: e.target.value })}
              className={cn(
                "h-8 flex-1 text-sm",
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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "mt-3 w-full gap-1",
              isDark &&
                "border-neutral-600 text-neutral-300 hover:bg-neutral-700 hover:text-white",
            )}
          >
            <Plus className="h-4 w-4" />
            Add Company
            <ChevronDown className="ml-auto h-3.5 w-3.5 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-48">
          <DropdownMenuItem onClick={addCustomItem}>
            <PenLine className="mr-2 h-4 w-4" />
            Custom
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setBrowseOpen(true)}>
            <Library className="mr-2 h-4 w-4" />
            Browse
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <BrowseCompaniesDialog
        open={browseOpen}
        onOpenChange={setBrowseOpen}
        existingCompanies={data.items}
        onAdd={addPresetCompanies}
        isDark={isDark}
      />

      <MediaLibraryDialog
        open={mediaLibraryOpen}
        onOpenChange={setMediaLibraryOpen}
        defaultTab="companies"
        onSelect={handleMediaSelect}
      />
    </div>
  );
}
