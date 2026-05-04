"use client";

import { cn } from "@/lib/utils";

/* ── Providers ── */
import { EventFormProviders } from "../events/shared/EventFormProviders";

/* ── Contexts ── */
import { useEventEditor } from "../events/shared/EventEditorContext";
import { useEventForm } from "../events/shared/EventFormContext";

/* ── Sub-components ── */
import {
  EventHero,
  EventDetailsForm,
  EventSectionsForm,
} from "@/components/event-form";
import { EventPreviewHeader } from "../events/preview/EventPreviewHeader";
import { TicketingButton } from "../events/TicketingButton";
import { EditorToolbox } from "../events/shared/EditorToolbox";
import { EventChecklist } from "./EventChecklist";

import type { FetchedEventData } from "@/lib/api/fetchEvent";

interface EventFormProps {
  data?: FetchedEventData;
  eventId?: string;
  mode?: "preview";
}

export default function EventForm({ data, eventId, mode }: EventFormProps) {
  return (
    <EventFormProviders data={data} eventId={eventId} mode={mode}>
      <EventFormUI />
    </EventFormProviders>
  );
}

function EventFormUI() {
  const {
    isEditing,
    isVisitorPreview,
    eventId,
    ticketingEnabled,
    eventStatus,
    openPricingModalRef,
    colors,
    isDark,
  } = useEventEditor();

  const { theme, accentGradient, carouselImages, form, sections } =
    useEventForm();
  const solidBg =
    theme.layout === "card" && theme.bgColor ? theme.bgColor : undefined;

  return (
    <div
      className={cn("min-h-screen", colors.pageBg, isDark && "dark")}
      style={solidBg ? { backgroundColor: solidBg } : undefined}
    >
      <div style={accentGradient ? { background: accentGradient } : undefined}>
        {isVisitorPreview ? (
          <EventPreviewHeader isDark={isDark} />
        ) : (
          <EditorToolbox />
        )}
        <div
          className={cn(
            "mx-auto max-w-4xl px-3 sm:px-6 pb-24!",
            isVisitorPreview ? "py-6 sm:py-8" : "pb-6 pt-20",
            colors.text,
          )}
        >
          <div className="space-y-6">
            <EventHero />
            <EventDetailsForm />
          </div>
          <div className="mt-10">
            <EventSectionsForm />
          </div>
        </div>
      </div>

      {!isVisitorPreview && isEditing && (
        <EventChecklist
          form={form}
          sections={sections}
          hasExistingThumbnail={carouselImages.length > 0}
        />
      )}

      {!isVisitorPreview && eventId && (
        <TicketingButton
          eventId={eventId}
          draft={eventStatus === "draft"}
          ticketingEnabled={ticketingEnabled}
          onNoTiersClick={() => openPricingModalRef.current()}
          editor
        />
      )}
    </div>
  );
}
