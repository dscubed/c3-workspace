"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ThemeAccent } from "@/components/events/shared/types";
import { useEditorTheme } from "@/components/events/shared/EventEditorContext";
import { useContext } from "react";
import { EventFormContext } from "@/components/events/shared/EventFormContext";
import { TooltipContent, TooltipTrigger, Tooltip } from "../ui/tooltip";

/* ── Accent → solid colour mapping ── */
const ACCENT_SOLID_MAP: Record<
  Exclude<ThemeAccent, "none" | "custom">,
  string
> = {
  yellow: "#eab308",
  cyan: "#06b6d4",
  purple: "#a855f7",
  orange: "#f97316",
  green: "#22c55e",
};

function getAccentButtonStyle(
  accent: ThemeAccent,
  customHex?: string,
): React.CSSProperties | undefined {
  if (accent === "none") return undefined;
  if (accent === "custom") {
    const hex = customHex || "#888888";
    return { backgroundColor: hex, color: "#fff", borderColor: hex };
  }
  const color = ACCENT_SOLID_MAP[accent];
  return { backgroundColor: color, color: "#fff", borderColor: color };
}

interface TicketingButtonProps {
  eventId: string;
  /** "edit" = shows "Edit Checkout" or "Setup Checkout"; "preview" = shows "Get Tickets" or "Register". */
  mode?: "edit" | "preview";
  accent?: ThemeAccent;
  accentCustom?: string;
  isDark?: boolean;
  draft?: boolean;
  /** Whether the event has at least one ticket tier. Read from context when inside the editor. */
  hasTiers?: boolean;
  /** Whether the button is in edit form. Defaults to false. */
  editor?: boolean;
  /** Whether the current user has already registered/purchased for this event. */
  isRegistered?: boolean;
}

/**
 * Sticky bottom button for ticketing.
 *
 * Desktop: centered card-style container that blends with the theme.
 * Mobile:  full-width sticky footer bar.
 *
 * `accent`, `accentCustom`, and `isDark` are read from EventEditorContext
 * when available, with explicit props taking precedence.
 */
export function TicketingButton({
  eventId,
  mode: modeProp,
  accent: accentProp,
  accentCustom: accentCustomProp,
  isDark: isDarkProp,
  draft = false,
  hasTiers: hasTiersProp,
  editor = false,
  isRegistered = false,
}: TicketingButtonProps) {
  const ctx = useEditorTheme();
  const formCtx = useContext(EventFormContext);
  const mode = modeProp ?? ctx?.viewMode ?? "preview";
  const accent = accentProp ?? ctx?.theme.accent ?? "none";
  const accentCustom = accentCustomProp ?? ctx?.theme.accentCustom;
  const isDark = isDarkProp ?? ctx?.isDark ?? false;
  const hasTiers =
    hasTiersProp ?? (formCtx ? formCtx.form.pricing.length > 0 : false);
  const router = useRouter();

  const label =
    mode === "edit"
      ? hasTiers
        ? "Edit Checkout"
        : "Setup Checkout"
      : isRegistered
        ? "Already Registered"
        : hasTiers
          ? "Get Tickets"
          : "Register";

  const accentStyle = getAccentButtonStyle(accent, accentCustom);
  const disabled = draft || isRegistered;
  const tooltip = draft
    ? "Publish your event to enable checkout"
    : isRegistered
      ? "You're already registered for this event"
      : undefined;

  const handleClick = () => {
    if (isRegistered) {
      toast.info("You're already registered for this event");
      return;
    }
    if (editor) {
      router.replace(`/events/${eventId}/checkout/edit`);
    } else {
      router.push(`/events/${eventId}/checkout`);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 sm:bottom-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="w-full">
            {/* Mobile: full-width footer bar */}
            <div
              className={cn(
                "flex w-full items-center justify-center border-t px-4 py-3 backdrop-blur-xl sm:hidden",
                isDark
                  ? "bg-neutral-800/90 border-neutral-700"
                  : "bg-background/90 border-border",
              )}
            >
              <Button
                size="lg"
                className={cn(
                  "w-full gap-2 rounded-lg transition-opacity",
                  !accentStyle
                    ? "bg-foreground text-background hover:bg-foreground/90"
                    : "hover:opacity-90",
                )}
                style={accentStyle}
                onClick={handleClick}
                disabled={disabled}
              >
                {label}
              </Button>
            </div>

            {/* Desktop: card-style pill */}
            <div
              className={cn(
                "hidden sm:block rounded-xl border px-3 py-2 shadow-lg backdrop-blur-xl",
                isDark
                  ? "bg-neutral-800/80 border-neutral-700/60"
                  : "bg-background/80 border-border/60",
              )}
            >
              <Button
                size="lg"
                className={cn(
                  "gap-2 rounded-lg px-10 transition-opacity",
                  !accentStyle
                    ? "bg-foreground text-background hover:bg-foreground/90"
                    : "hover:opacity-90",
                )}
                style={accentStyle}
                onClick={handleClick}
                disabled={disabled}
              >
                {label}
              </Button>
            </div>
          </div>
        </TooltipTrigger>
        {tooltip && <TooltipContent sideOffset={4}>{tooltip}</TooltipContent>}
      </Tooltip>
    </div>
  );
}
