"use client";

import { useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCheckoutContext } from "./CheckoutContext";
import { calcFeeDisplay } from "@/lib/stripe/fees";
import { getTierWindowStatus } from "@/lib/utils/tierWindow";
import { TicketTier } from "../../shared";

function TicketStatusBadge({
  tier,
  isMember,
  isEditing,
}: {
  tier: TicketTier;
  isMember: boolean | null;
  isEditing: boolean;
}) {
  const membersOnly = !!tier.memberVerification;
  const locked = membersOnly && isMember !== true && !isEditing;
  const window = getTierWindowStatus(tier);

  if (locked) {
    return (
      <Badge variant="outline" className="text-xs bg-violet-100 text-violet-700 border-violet-200">
        <Lock className="size-2.5 mr-1" />
        Members only
      </Badge>
    );
  }

  if (membersOnly) {
    return (
      <Badge variant="outline" className="text-xs bg-violet-100 text-violet-700 border-violet-200">
        Member
      </Badge>
    );
  }

  if (window.type === "opens_in") {
    return (
      <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-200">
        {window.label}
      </Badge>
    );
  }

  if (window.type === "closes_in") {
    return (
      <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
        {window.label}
      </Badge>
    );
  }

  if (window.type === "closed") {
    return (
      <Badge variant="outline" className="text-xs bg-gray-100 text-gray-500 border-gray-200">
        Closed
      </Badge>
    );
  }

  return null;
}

export function TicketPicker() {
  const {
    checkoutMode,
    pricing,
    effectiveSelectedTierId,
    setSelectedTierId,
    thumbnailUrl,
    isEditing,
    isMember,
    colors,
    openPricingModal,
  } = useCheckoutContext();

  const [open, setOpen] = useState(false);

  if (checkoutMode !== "ticket" || !pricing.length) return null;

  const selectedTierData =
    pricing.find((t) => t.id === effectiveSelectedTierId) ?? null;

  return (
    <div
      className={cn(
        "mt-4 flex items-center gap-3 rounded-xl border p-3",
        colors.cardBg,
        colors.cardBorder,
        isEditing && "cursor-pointer",
      )}
      onClick={isEditing ? openPricingModal : undefined}
    >
      {thumbnailUrl && (
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
          <Image src={thumbnailUrl} alt="Event" fill className="object-cover" />
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          disabled={isEditing}
          className={cn(
            "flex flex-1 items-center justify-between gap-2 rounded-lg px-2 py-1 text-sm outline-none transition-colors",
            "hover:bg-black/5 dark:hover:bg-white/5",
            "disabled:cursor-not-allowed disabled:opacity-60",
            !selectedTierData ? colors.textMuted : colors.text,
          )}
        >
          <span className="flex items-center gap-1.5 font-semibold">
            {selectedTierData ? (
              <>
                {selectedTierData.name}
                <TicketStatusBadge tier={selectedTierData} isMember={isMember} isEditing={isEditing} />
              </>
            ) : (
              <span className={cn("font-normal", colors.textMuted)}>Select a ticket...</span>
            )}
          </span>

          <div className="flex gap-4 items-center">
            {/* Selected tier price summary */}
            {selectedTierData && (
              <div className="shrink-0 text-right">
                <p className={cn("text-lg font-bold", colors.text)}>
                  {selectedTierData.price > 0
                    ? `$${selectedTierData.price.toFixed(2)}`
                    : "Free"}
                </p>
                {selectedTierData.price > 0 && (
                  <p className={cn("text-xs", colors.textMuted)}>
                    + ${calcFeeDisplay(selectedTierData.price).toFixed(2)} fee
                  </p>
                )}
              </div>
            )}

            <ChevronDown className="size-4 shrink-0 opacity-60" />
          </div>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={4}
          className="p-1"
          style={{ width: "var(--radix-popover-trigger-width)" }}
        >
          <div className="flex flex-col">
            {pricing.map((tier) => {
              const membersOnly = !!tier.memberVerification;
              const locked = membersOnly && isMember !== true && !isEditing;
              const window = getTierWindowStatus(tier);
              const unavailable =
                locked ||
                window.type === "closed" ||
                window.type === "opens_in";
              const fee = tier.price > 0 ? calcFeeDisplay(tier.price) : 0;
              const isSelected = effectiveSelectedTierId === tier.id;

              return (
                <button
                  key={tier.id}
                  type="button"
                  disabled={unavailable}
                  onClick={() => {
                    setSelectedTierId(tier.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex items-center justify-between gap-4 px-3 py-2 rounded-md text-left transition-colors",
                    !unavailable && "hover:bg-accent cursor-pointer",
                    unavailable && "opacity-50 cursor-not-allowed",
                    isSelected && "bg-accent",
                  )}
                >
                  {/* Left: name + badges */}
                  <div className="flex flex-1 flex-wrap items-center gap-1.5 min-w-0">
                    <span className="font-semibold text-sm">{tier.name}</span>
                    <TicketStatusBadge tier={tier} isMember={isMember} isEditing={isEditing} />
                  </div>

                  {/* Right: price + fee */}
                  <div className="shrink-0 text-right">
                    <p className="font-bold text-sm">
                      {tier.price > 0 ? `$${tier.price.toFixed(2)}` : "Free"}
                    </p>
                    {tier.price > 0 && (
                      <p className="text-xs text-muted-foreground">
                        + ${fee.toFixed(2)} fee
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>


    </div>
  );
}
