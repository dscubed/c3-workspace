"use client";

import { Minus, Plus } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useCheckoutContext } from "./CheckoutContext";

const FEE_PER_TICKET = 0.75;

export function TicketPicker() {
  const {
    checkoutMode,
    pricing,
    selectedTier,
    effectiveSelectedTierId,
    setSelectedTierId,
    thumbnailUrl,
    quantity,
    setQuantity,
    isEditing,
    colors,
    openPricingModal,
  } = useCheckoutContext();

  if (checkoutMode !== "ticket" || !pricing.length || !selectedTier) return null;

  return (
    <div
      className={cn(
        "mt-4 flex items-center gap-4 rounded-xl border p-3",
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

      <div className="min-w-0 flex-1">
        {pricing.length > 1 ? (
          <Select
            value={effectiveSelectedTierId}
            onValueChange={setSelectedTierId}
            disabled={isEditing}
          >
            <SelectTrigger
              className={cn(
                "h-auto border-none bg-transparent p-0 text-base font-semibold shadow-none",
                colors.text,
              )}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pricing.map((tier) => (
                <SelectItem key={tier.id} value={tier.id}>
                  {tier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className={cn("text-base font-semibold", colors.text)}>
            {selectedTier.name}
          </p>
        )}
      </div>

      <div className="shrink-0 text-right">
        <p className={cn("text-lg font-bold", colors.text)}>
          {selectedTier.price > 0
            ? `$${selectedTier.price.toFixed(2)}`
            : "Free"}
        </p>
        {selectedTier.price > 0 && (
          <p className={cn("text-xs", colors.textMuted)}>
            + ${FEE_PER_TICKET.toFixed(2)} fee
          </p>
        )}
      </div>

      <div
        className={cn(
          "flex shrink-0 items-center rounded-lg border",
          colors.cardBorder,
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          disabled={isEditing || quantity <= 1}
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <span className={cn("w-8 text-center text-sm font-medium", colors.text)}>
          {quantity}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setQuantity((q) => Math.min(10, q + 1))}
          disabled={isEditing || quantity >= 10}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
