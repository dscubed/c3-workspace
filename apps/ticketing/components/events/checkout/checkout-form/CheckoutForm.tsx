"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EditorToolbox } from "@/components/events/shared/EditorToolbox";
import { CheckoutProvider, useCheckoutContext } from "./CheckoutContext";
import { CheckoutEditor } from "./CheckoutEditor";
import { CheckoutPreview } from "./CheckoutPreview";

interface CheckoutFormProps {
  eventId: string;
  mode: "edit" | "preview";
  availabilityWindowOpen?: boolean;
}

export default function CheckoutForm({
  eventId,
  mode,
  availabilityWindowOpen = true,
}: CheckoutFormProps) {
  return (
    <CheckoutProvider
      eventId={eventId}
      mode={mode}
      availabilityWindowOpen={availabilityWindowOpen}
    >
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
    setPreviewMode,
    eventName,
    isDark,
    colors,
    accentGradient,
    solidBg,
    availabilityWindowOpen,
    checkoutMode,
    editorMode,
  } = useCheckoutContext();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pageTitle = checkoutMode === "registration" ? "Register" : "Checkout";

  return (
    <div
      className={cn("min-h-screen pb-12", colors.pageBg, isDark && "dark")}
      style={solidBg ? { backgroundColor: solidBg } : undefined}
    >
      {!previewMode && <EditorToolbox />}

      {previewMode && editorMode === "edit" && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-2 px-3 py-2 sm:px-6 border-b bg-amber-500/10 border-amber-500/30 backdrop-blur">
          <span
            className={cn(
              "text-xs font-medium",
              isDark ? "text-amber-300" : "text-amber-700",
            )}
          >
            Preview mode — changes won&apos;t be saved or processed
          </span>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "gap-2 text-xs",
              isDark
                ? "text-amber-300 hover:text-amber-100 hover:bg-white/10"
                : "text-amber-700 hover:text-amber-900 hover:bg-amber-500/10",
            )}
            onClick={() => setPreviewMode(false)}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Exit Preview
          </Button>
        </div>
      )}

      {previewMode && editorMode === "preview" && (
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
              {pageTitle}
            </h1>
            {eventName && (
              <p className={cn("mt-1 text-sm", colors.textMuted)}>
                {eventName}
              </p>
            )}
          </div>

          {/* Availability closed state */}
          {previewMode && !availabilityWindowOpen && (
            <div
              className={cn(
                "mt-6 flex flex-col items-center gap-3 rounded-xl border px-6 py-10 text-center",
                colors.cardBg,
                colors.cardBorder,
              )}
            >
              <Clock className={cn("h-10 w-10 opacity-40", colors.textMuted)} />
              <p className={cn("font-semibold", colors.text)}>
                {checkoutMode === "registration"
                  ? "Registration is closed"
                  : "Ticketing is closed"}
              </p>
              <p className={cn("text-sm max-w-xs", colors.textMuted)}>
                {checkoutMode === "registration"
                  ? "Registration opens at the event start time and closes at the end of the event."
                  : "Tickets are only available from event start until the event ends."}
              </p>
            </div>
          )}

          {isEditing && <CheckoutEditor />}
          {!isEditing && availabilityWindowOpen && <CheckoutPreview />}
        </div>
      </div>
    </div>
  );
}
