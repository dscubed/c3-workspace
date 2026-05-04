"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SectionWrapper } from "@/components/events/preview/SectionWrapper";
import { EditorToolbox } from "@/components/events/shared/EditorToolbox";
import { CheckoutProvider, useCheckoutContext } from "./CheckoutContext";
import { CheckoutEditor } from "./CheckoutEditor";
import { CheckoutPreview } from "./CheckoutPreview";

interface CheckoutFormProps {
  eventId: string;
  mode: "edit" | "preview";
}

export default function CheckoutForm({ eventId, mode }: CheckoutFormProps) {
  return (
    <CheckoutProvider eventId={eventId} mode={mode}>
      <CheckoutFormUI />
    </CheckoutProvider>
  );
}

function CheckoutFormUI() {
  const router = useRouter();
  const {
    eventId,
    isLoading,
    isEditing,
    previewMode,
    eventName,
    theme,
    isDark,
    colors,
    accentGradient,
    solidBg,
    ticketingEnabled,
    handlePaymentStart,
  } = useCheckoutContext();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div
      className={cn("min-h-screen pb-12", colors.pageBg, isDark && "dark")}
      style={solidBg ? { backgroundColor: solidBg } : undefined}
    >
      {!previewMode && <EditorToolbox />}

      {previewMode && (
        <div className="fixed top-0 left-0 right-0 z-50 px-3 py-2 sm:px-6">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "gap-2",
              isDark
                ? "text-white/70 hover:text-white hover:bg-white/10"
                : "text-black/60 hover:text-black hover:bg-black/10",
            )}
            onClick={() => router.push(`/events/${eventId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Event
          </Button>
        </div>
      )}

      <div style={accentGradient ? { background: accentGradient } : undefined}>
        <div
          className={cn(
            "mx-auto max-w-3xl px-3 sm:px-6",
            previewMode ? "py-6 sm:py-8 pt-10" : "py-6 sm:py-8",
            colors.text,
          )}
        >
          {!previewMode && <div className="h-14" />}

          <div className="mb-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Checkout
            </h1>
            {eventName && (
              <p className={cn("mt-1 text-sm", colors.textMuted)}>
                {eventName}
              </p>
            )}
          </div>

          {isEditing && <CheckoutEditor />}
          {!isEditing && <CheckoutPreview />}

          {(ticketingEnabled || previewMode) && (
            <div className="mt-8">
              <SectionWrapper
                title="Payment"
                layout={theme.layout}
                isDark={isDark}
              >
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <CreditCard
                    className={cn("h-10 w-10 opacity-40", colors.textMuted)}
                  />
                  <div>
                    <Button onClick={handlePaymentStart}>Test Payment</Button>
                  </div>
                </div>
              </SectionWrapper>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
