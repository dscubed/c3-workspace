"use client";

import { useRef, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { useEventEditor } from "@/components/events/shared/EventEditorContext";
import { useEventForm } from "@/components/events/shared/EventFormContext";
import { useEventCollab } from "@/components/events/shared/EventCollabContext";
import {
  EventNameField,
  EventCategoryField,
  EventTagsField,
  EventHostsField,
  EventPricingField,
  EventLinksField,
  EventDateLocationField,
} from "@/components/events/fields";
import { PricingModal } from "@/components/events/create/pricing/PricingModal";
import { SectionWrapper } from "@/components/events/preview/SectionWrapper";
import { AttentionBadge } from "@/components/event-form/EventChecklist";
import { CollaboratorBadge } from "./CollaboratorBadge";

/**
 * The main event details card: name, category, tags, date/location,
 * hosts, pricing, and links. Owns its own modal state for date/location
 * and the preview detail drawer.
 */
export function EventDetailsForm() {
  const { isEditing, pricingModalOpen, setPricingModalOpen, checklistRefsRef } =
    useEventEditor();
  const { form, markDirty, flush, updateField } = useEventForm();
  const { collaborators, handleFieldFocus, handleFieldBlur } = useEventCollab();

  const startDateRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checklistRefsRef.current["start-date"] = startDateRef;
    checklistRefsRef.current.location = startDateRef;
    checklistRefsRef.current.category = categoryRef;
    checklistRefsRef.current.tags = tagsRef;
  });

  /* ── Derived attention flags ── */
  const needsStartDate = form.occurrences.length === 0;
  const needsLocation = form.venues.every((v) => v.type === "tba");
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
            <EventDateLocationField
              isEditing={isEditing}
              collaborators={collaborators}
              needsStartDate={needsStartDate}
              needsLocation={needsLocation}
            />
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
            <EventPricingField />
            <PricingModal
              open={pricingModalOpen}
              onOpenChange={setPricingModalOpen}
              value={form.pricing}
              eventCapacity={form.eventCapacity}
              eventStartDate={form.occurrences[0]?.startDate}
              eventStartTime={form.occurrences[0]?.startTime}
              onSave={(tiers, cap) => {
                updateField("pricing", tiers);
                updateField("eventCapacity", cap);
                flush();
              }}
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
