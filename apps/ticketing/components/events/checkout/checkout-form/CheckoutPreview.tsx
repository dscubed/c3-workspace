"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { TicketForm } from "./TicketForm";
import { useCheckoutContext } from "./CheckoutContext";

const FEE_PER_TICKET = 0.75;

export function CheckoutPreview() {
  const {
    colors,
    pricing,
    selectedTier,
    effectiveSelectedTierId,
    setSelectedTierId,
    thumbnailUrl,
    quantity,
    setQuantity,
    activeTicketTab,
    setActiveTicketTab,
  } = useCheckoutContext();

  return (
    <>
      {pricing.length > 0 && selectedTier && (
        <div
          className={cn(
            "mt-4 flex items-center gap-4 rounded-xl border p-3",
            colors.cardBg,
            colors.cardBorder,
          )}
        >
          {thumbnailUrl && (
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
              <Image
                src={thumbnailUrl}
                alt="Event"
                fill
                className="object-cover"
              />
            </div>
          )}

          <div className="min-w-0 flex-1">
            {pricing.length > 1 ? (
              <Select
                value={effectiveSelectedTierId}
                onValueChange={setSelectedTierId}
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
              disabled={quantity <= 1}
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <span
              className={cn(
                "w-8 text-center text-sm font-medium",
                colors.text,
              )}
            >
              {quantity}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setQuantity((q) => Math.min(10, q + 1))}
              disabled={quantity >= 10}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {quantity > 1 ? (
        <Tabs
          value={activeTicketTab}
          onValueChange={setActiveTicketTab}
          className="mt-8"
        >
          <TabsList>
            {Array.from({ length: quantity }, (_, i) => (
              <TabsTrigger key={i} value={`ticket-${i}`}>
                Ticket {i + 1}
              </TabsTrigger>
            ))}
          </TabsList>

          {Array.from({ length: quantity }, (_, i) => (
            <TabsContent key={i} value={`ticket-${i}`}>
              <TicketForm ticketIndex={i} />
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="mt-8">
          <TicketForm ticketIndex={0} />
        </div>
      )}
    </>
  );
}
