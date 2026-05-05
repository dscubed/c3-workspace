"use client";

import { Minus, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { TicketForm } from "./TicketForm";
import { useCheckoutContext } from "./CheckoutContext";
import { PillTabs } from "@c3/ui";
import { useState } from "react";

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
    checkoutMode,
    editorMode,
    handlePaymentStart,
    handleRegister,
  } = useCheckoutContext();

  const [submitting, setSubmitting] = useState(false);

  const isPaid =
    checkoutMode === "ticket" && !!selectedTier && selectedTier.price > 0;

  const attendeeLabel = checkoutMode === "registration" ? "Attendee" : "Ticket";

  const tabs = Array.from({ length: quantity }, (_, i) => ({
    value: `ticket-${i}`,
    label: `${attendeeLabel} ${i + 1}`,
  }));

  const activeIndex = tabs.findIndex((t) => t.value === activeTicketTab);
  const safeIndex = activeIndex >= 0 ? activeIndex : 0;

  async function handleSubmit() {
    setSubmitting(true);
    try {
      if (isPaid) await handlePaymentStart();
      else await handleRegister();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Tier card — only for ticket mode */}
      {checkoutMode === "ticket" && pricing.length > 0 && selectedTier && (
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

          {/* Quantity stepper for ticket mode */}
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
              className={cn("w-8 text-center text-sm font-medium", colors.text)}
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

      {/* Attendee pill tabs + Add/Remove for registration */}
      <div className="mt-8 flex flex-wrap items-center gap-2">
        <PillTabs
          tabs={tabs}
          value={activeTicketTab}
          onValueChange={setActiveTicketTab}
        />

        {checkoutMode === "registration" && (
          <>
            <button
              onClick={() => {
                const next = quantity + 1;
                setQuantity(next);
                setActiveTicketTab(`ticket-${next - 1}`);
              }}
              className="inline-flex items-center gap-1 rounded-full border border-dashed px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:border-solid hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>

            {quantity > 1 && (
              <button
                onClick={() => {
                  const next = quantity - 1;
                  setQuantity(next);
                  if (safeIndex >= next)
                    setActiveTicketTab(`ticket-${next - 1}`);
                }}
                className="inline-flex items-center gap-1 rounded-full border border-dashed px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:border-red-400 hover:border-solid hover:text-red-500"
              >
                Remove
              </button>
            )}
          </>
        )}
      </div>

      {/* Active attendee form */}
      <div className="mt-6">
        <TicketForm ticketIndex={safeIndex} />
      </div>

      {/* Submit */}
      <div className="mt-8">
        <Button
          size="lg"
          className="w-full gap-2"
          onClick={handleSubmit}
          disabled={submitting || editorMode === "edit"}
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isPaid
            ? `Pay $${((selectedTier!.price + FEE_PER_TICKET) * quantity).toFixed(2)}`
            : checkoutMode === "registration"
              ? "Register"
              : "Get Free Ticket"}
        </Button>
        {editorMode === "edit" && (
          <p className={cn("mt-2 text-center text-xs", colors.textMuted)}>
            Admin preview — submitting is disabled
          </p>
        )}
        {editorMode === "preview" && checkoutMode === "registration" && (
          <p className={cn("mt-2 text-center text-xs", colors.textMuted)}>
            You&apos;ll receive a QR code to log your attendance and earn
            rewards.
          </p>
        )}
        {editorMode === "preview" && checkoutMode === "ticket" && !isPaid && (
          <p className={cn("mt-2 text-center text-xs", colors.textMuted)}>
            Free admission — your QR code will be sent by email.
          </p>
        )}
      </div>
    </>
  );
}
