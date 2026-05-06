"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCheckoutContext } from "./CheckoutContext";

const FEE_PER_TICKET = 0.75;

export function SubmitButton() {
  const {
    isEditing,
    editorMode,
    checkoutMode,
    selectedTier,
    colors,
    handlePaymentStart,
    handleRegister,
  } = useCheckoutContext();

  const [submitting, setSubmitting] = useState(false);

  const isPaid =
    checkoutMode === "ticket" && !!selectedTier && selectedTier.price > 0;

  async function handleSubmit() {
    setSubmitting(true);
    try {
      if (isPaid) await handlePaymentStart();
      else await handleRegister();
    } finally {
      setSubmitting(false);
    }
  }

  const label = isPaid
    ? `Pay $${(selectedTier!.price + FEE_PER_TICKET).toFixed(2)}`
    : checkoutMode === "registration"
      ? "Register"
      : "Get Free Ticket";

  return (
    <div className="mt-8">
      <Button
        size="lg"
        className="w-full gap-2"
        onClick={handleSubmit}
        disabled={submitting || isEditing}
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {label}
      </Button>

      {isEditing && (
        <p className={cn("mt-2 text-center text-xs", colors.textMuted)}>
          Admin preview — submitting is disabled
        </p>
      )}
      {!isEditing && editorMode === "preview" && checkoutMode === "registration" && (
        <p className={cn("mt-2 text-center text-xs", colors.textMuted)}>
          You&apos;ll receive a QR code to log your attendance and earn rewards.
        </p>
      )}
      {!isEditing && editorMode === "preview" && checkoutMode === "ticket" && !isPaid && (
        <p className={cn("mt-2 text-center text-xs", colors.textMuted)}>
          Free admission — your QR code will be sent by email.
        </p>
      )}
    </div>
  );
}
