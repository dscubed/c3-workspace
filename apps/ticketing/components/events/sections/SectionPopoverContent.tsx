import { cn } from "@c3/utils";
import {
  SECTION_TYPES,
  SECTION_META,
  SECTION_ICON_MAP,
  SectionType,
} from "./types";
import { Check } from "lucide-react";
import { useEventForm } from "../shared/EventFormContext";

export function SectionPopoverContent({
  activeSections,
  onAdd,
}: {
  activeSections: string[];
  onAdd: (type: SectionType) => void;
}) {
  const { isDark } = useEventForm();

  return (
    <>
      {SECTION_TYPES.map((type) => {
        const meta = SECTION_META[type];
        const Icon = SECTION_ICON_MAP[type];
        const alreadyAdded = activeSections.includes(type);

        return (
          <button
            key={type}
            type="button"
            disabled={alreadyAdded}
            onClick={() => onAdd(type)}
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40",
              isDark
                ? "hover:bg-neutral-700 text-neutral-100"
                : "hover:bg-muted",
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0",
                isDark ? "text-neutral-400" : "text-muted-foreground",
              )}
            />
            <div className="flex-1">
              <div className="font-medium">{meta.label}</div>
              <div
                className={cn(
                  "text-xs",
                  isDark ? "text-neutral-400" : "text-muted-foreground",
                )}
              >
                {meta.description}
              </div>
            </div>
            {alreadyAdded && (
              <Check
                className={cn(
                  "h-4 w-4 shrink-0",
                  isDark ? "text-neutral-400" : "text-muted-foreground",
                )}
              />
            )}
          </button>
        );
      })}
    </>
  );
}
