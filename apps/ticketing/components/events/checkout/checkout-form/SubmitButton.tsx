"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useCheckoutContext } from "./CheckoutContext";
import { calcFeeDisplay } from "@/lib/stripe/fees";

export function SubmitButton() {
  const {
    isEditing,
    editorMode,
    checkoutMode,
    selectedTier,
    colors,
    isFormValid,
    handlePaymentStart,
    handleRegister,
    user,
    getFieldValue,
  } = useCheckoutContext();

  const [submitting, setSubmitting] = useState(false);
  const [showEmailWarning, setShowEmailWarning] = useState(false);

  const isPaid =
    checkoutMode === "ticket" && !!selectedTier && selectedTier.price > 0;

  async function checkEmailAndSubmit() {
    const typedEmail = getFieldValue(0, "email").toLowerCase().trim();
    const ownEmail = user?.email?.toLowerCase().trim();
    // Skip check if typing their own email
    if (typedEmail && typedEmail !== ownEmail) {
      setSubmitting(true);
      try {
        const res = await fetch(
          `/api/profiles/check-email?email=${encodeURIComponent(typedEmail)}`,
        );
        if (!res.ok) {
          toast.error("Couldn't verify email. Try again.");
          setSubmitting(false);
          return;
        }
        const { exists } = await res.json();
        if (exists) {
          setShowEmailWarning(true);
          setSubmitting(false);
          return;
        }
      } catch {
        toast.error("Couldn't verify email. Check your connection.");
        setSubmitting(false);
        return;
      }
      setSubmitting(false);
    }
    await proceed();
  }

  async function proceed() {
    setSubmitting(true);
    try {
      if (isPaid) await handlePaymentStart();
      else await handleRegister();
    } finally {
      setSubmitting(false);
    }
  }

  const noTierSelected = checkoutMode === "ticket" && !selectedTier;

  const label = noTierSelected
    ? "Select a ticket"
    : isPaid
      ? `Pay $${(selectedTier!.price + calcFeeDisplay(selectedTier!.price)).toFixed(2)}`
      : checkoutMode === "registration"
        ? "Register"
        : "Get Free Ticket";

  const typedEmail = getFieldValue(0, "email");

  return (
    <div className="mt-8">
      <Button
        size="lg"
        className="w-full gap-2"
        onClick={checkEmailAndSubmit}
        disabled={submitting || isEditing || !isFormValid}
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {label}
      </Button>

      {isEditing && (
        <p className={cn("mt-2 text-center text-xs", colors.textMuted)}>
          Admin preview — submitting is disabled
        </p>
      )}
      {!isEditing && !isFormValid && (
        <p className="mt-2 text-center text-xs text-red-500">
          {noTierSelected
            ? "Please select a ticket above."
            : "Please fill in all required fields above."}
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

      <AlertDialog open={showEmailWarning} onOpenChange={setShowEmailWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>This email has an account</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{typedEmail}</strong> belongs to an existing Connect3
              account. The ticket stays yours, but the owner of that email
              will also be able to see and use it from their account.
              <br />
              <br />
              If that&apos;s not your email, go back and change it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Change email</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowEmailWarning(false);
                proceed();
              }}
            >
              Yes, continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
