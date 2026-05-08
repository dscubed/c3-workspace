"use client";

import { useRef, useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { cn } from "@/lib/utils";

import { useEventEditor } from "@/components/events/shared/EventEditorContext";
import { useEventForm } from "@/components/events/shared/EventFormContext";
import { useEventCollab } from "@/components/events/shared/EventCollabContext";
import {
  EventNameField,
  EventCategoryField,
  EventTagsField,
  EventDateField,
  EventLocationField,
  EventHostsField,
  EventPricingField,
  EventLinksField,
} from "@/components/events/fields";
import { DateLocationSection } from "@/components/events/create/DateLocationSection";
import { EventDetailModal } from "@/components/events/preview/EventDetailModal";
import { SectionWrapper } from "@/components/events/preview/SectionWrapper";
import { AttentionBadge } from "@/components/event-form/EventChecklist";
import { CollaboratorBadge } from "./CollaboratorBadge";

/**
 * The main event details card: name, category, tags, date/location,
 * hosts, pricing, and links. Owns its own modal state for date/location
 * and the preview detail drawer.
 */
export function EventDetailsForm() {
  const { isEditing, openPricingModalRef, checklistRefsRef } = useEventEditor();
  const { form, markDirty, flush } = useEventForm();
  const { collaborators, handleFieldFocus, handleFieldBlur } = useEventCollab();

  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [dateLocationModalOpen, setDateLocationModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const startDateRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);

  // Register refs for EventChecklist scroll-to and modal opener — done in a layout
  // effect so we never mutate ref.current during render.
  useEffect(() => {
    checklistRefsRef.current["start-date"] = startDateRef;
    checklistRefsRef.current.location = startDateRef;
    checklistRefsRef.current.category = categoryRef;
    checklistRefsRef.current.tags = tagsRef;
    openPricingModalRef.current = () => setPricingModalOpen(true);
  });

  /* ── Derived attention flags ── */
  const needsStartDate = form.occurrences.length === 0;
  const needsLocation = form.locationType === "tba";
  const needsCategory = !form.category;
  const needsTags = form.tags.length < 2;

  return (
    <SectionWrapper title="">
      <div className="space-y-6">
        {/* Name */}
        <div onFocus={() => handleFieldFocus("event")} onBlur={handleFieldBlur}>
          <CollaboratorBadge group="event" collaborators={collaborators} />
          <EventNameField />
        </div>

        {/* Category + Tags */}
        <div
          className={cn(
            "flex flex-wrap items-center",
            isEditing ? "gap-6" : "gap-2",
          )}
        >
          <div ref={categoryRef} className="relative">
            {isEditing && <AttentionBadge show={needsCategory} />}
            <EventCategoryField />
          </div>
          <Separator
            className={isEditing ? "h-6!" : "h-5!"}
            orientation="vertical"
          />
          <div ref={tagsRef} className="relative">
            {isEditing && <AttentionBadge show={needsTags} />}
            <EventTagsField />
          </div>
        </div>

        {/* Date / Location / Hosts / Pricing / Links */}
        <div className="space-y-3">
          {/* Date + Location */}
          <div
            ref={startDateRef}
            className="relative"
            onFocus={() => handleFieldFocus("location")}
            onBlur={handleFieldBlur}
          >
            {isEditing && (
              <AttentionBadge show={needsStartDate || needsLocation} />
            )}
            <CollaboratorBadge group="location" collaborators={collaborators} />
            <div className="space-y-3">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => setDateLocationModalOpen(true)}
                    className="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 -mx-2 text-left transition-colors hover:bg-muted/50"
                  >
                    <EventDateField />
                    <Pencil className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDateLocationModalOpen(true)}
                    className="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 -mx-2 text-left transition-colors hover:bg-muted/50"
                  >
                    <EventLocationField />
                    <Pencil className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                  <ResponsiveModal
                    open={dateLocationModalOpen}
                    onOpenChange={setDateLocationModalOpen}
                    title="Date & location"
                    className="max-w-lg"
                  >
                    <div className="overflow-y-auto max-h-[70vh] pr-1">
                      <DateLocationSection />
                    </div>
                  </ResponsiveModal>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setDetailModalOpen(true)}
                    className="flex w-full items-center text-left rounded-md px-2 py-1.5 -mx-2 transition-colors hover:bg-muted/50 cursor-pointer"
                  >
                    <EventDateField />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailModalOpen(true)}
                    className="flex w-full items-center text-left rounded-md px-2 py-1.5 -mx-2 transition-colors hover:bg-muted/50 cursor-pointer"
                  >
                    <EventLocationField />
                  </button>
                  <EventDetailModal
                    open={detailModalOpen}
                    onOpenChange={setDetailModalOpen}
                  />
                </>
              )}
            </div>
          </div>

          {/* Hosts */}
          <div
            onFocus={() => handleFieldFocus("hosts")}
            onBlur={handleFieldBlur}
            className="relative"
          >
            <CollaboratorBadge group="hosts" collaborators={collaborators} />
            <EventHostsField onInvitesSent={() => markDirty("hosts")} />
          </div>

          {/* Pricing */}
          <div
            onFocus={() => handleFieldFocus("pricing")}
            onBlur={handleFieldBlur}
            className="relative"
          >
            <CollaboratorBadge group="pricing" collaborators={collaborators} />
            <EventPricingField
              onAfterSave={() => flush()}
              modalOpen={pricingModalOpen}
              onModalOpenChange={setPricingModalOpen}
            />
          </div>

          {/* Links */}
          <div
            onFocus={() => handleFieldFocus("links")}
            onBlur={handleFieldBlur}
            className="relative"
          >
            <CollaboratorBadge group="links" collaborators={collaborators} />
            <EventLinksField />
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
