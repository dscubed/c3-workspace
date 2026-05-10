"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { SECTION_TYPES } from "./types";
import type { SectionType } from "@c3/types";
import { useEditorTheme } from "../shared/EventEditorContext";
import { AttentionBadge } from "@/components/event-form/EventChecklist";
import { SectionPopoverContent } from "./SectionPopoverContent";

interface AddSectionButtonProps {
  /** Section types already added (greyed out / disabled) */
  activeSections: SectionType[];
  onAdd: (type: SectionType) => void;
  /** Show a pinging blue dot on the button */
  showAttentionBadge?: boolean;
}

export function AddSectionButton({
  activeSections,
  onAdd,
  showAttentionBadge,
}: AddSectionButtonProps) {
  const ctx = useEditorTheme();
  const isDark = ctx?.isDark;
  const [open, setOpen] = useState(false);

  const availableTypes = SECTION_TYPES.filter(
    (t) => !activeSections.includes(t),
  );

  // Nothing left to add
  if (availableTypes.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "relative w-full mt-4 gap-2",
            isDark &&
              "border-neutral-600 text-neutral-300 hover:bg-neutral-700 hover:text-white",
          )}
        >
          <AttentionBadge show={showAttentionBadge || false} />
          <Plus className="h-4 w-4" />
          Add Section
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-64 p-1",
          isDark && "border-neutral-700 bg-neutral-800",
        )}
        align="center"
      >
        <SectionPopoverContent
          activeSections={activeSections}
          onAdd={(type) => {
            onAdd(type);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
