"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { EditorToolbox } from "@/components/events/shared/EditorToolbox";
import { PricingModal } from "@/components/events/create/PricingModal";
import { CheckoutProvider, useCheckoutContext } from "./CheckoutContext";
import { CheckoutHeader } from "./CheckoutHeader";
import { TicketPicker } from "./TicketPicker";
import { AttendeeTabs } from "./AttendeeTabs";
import { TicketForm } from "./TicketForm";
import { CustomFieldsSection } from "./CustomFieldsSection";
import { SubmitButton } from "./SubmitButton";
import { BackToEventButton } from "./BackToEventButton";
import { AvailabilityClosedBanner } from "./AvailabilityClosedBanner";
import { useAttendeeTabs } from "./useAttendeeTabs";

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
  const {
    isLoading,
    isEditing,
    isDark,
    colors,
    accentGradient,
    solidBg,
    availabilityWindowOpen,
    editorMode,
    pricing,
    pricingModalOpen,
    setPricingModalOpen,
    handlePricingSave,
    eventCapacity,
    eventStartDate,
    eventStartTime,
  } = useCheckoutContext();
  const { safeIndex } = useAttendeeTabs();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const showContent = isEditing || availabilityWindowOpen;

  return (
    <div
      className={cn("min-h-screen pb-12", colors.pageBg, isDark && "dark")}
      style={solidBg ? { backgroundColor: solidBg } : undefined}
    >
      <div style={accentGradient ? { background: accentGradient } : undefined}>
        {editorMode === "preview" ? <BackToEventButton /> : <EditorToolbox />}
        <div
          className={cn(
            "mx-auto max-w-3xl px-3 sm:px-6 py-6 sm:py-8",
            isEditing && "pt-20",
            colors.text,
          )}
        >
          <CheckoutHeader />

          {!isEditing && !availabilityWindowOpen && <AvailabilityClosedBanner />}

          {showContent && (
            <>
              <TicketPicker />

              {!isEditing && <AttendeeTabs />}

              <div className="mt-6 space-y-8">
                <TicketForm ticketIndex={safeIndex} />
                <CustomFieldsSection />
              </div>

              <SubmitButton />
            </>
          )}
        </div>
      </div>

      <PricingModal
        open={pricingModalOpen}
        onOpenChange={setPricingModalOpen}
        value={pricing}
        onSave={handlePricingSave}
        eventCapacity={eventCapacity}
        eventStartDate={eventStartDate}
        eventStartTime={eventStartTime}
      />
    </div>
  );
}
