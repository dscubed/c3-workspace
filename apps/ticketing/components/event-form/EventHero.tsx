"use client";

import { useRef, useState, useEffect } from "react";
import { useEventEditor } from "@/components/events/shared/EventEditorContext";
import { useEventForm } from "@/components/events/shared/EventFormContext";
import { useEventCollab } from "@/components/events/shared/EventCollabContext";
import { EventImageField } from "@/components/events/fields";
import { ImageManagerDialog } from "@/components/events/create/image/ImageManagerDialog";
import { CollaboratorBadge } from "./CollaboratorBadge";

/**
 * The image carousel hero at the top of an event page.
 * Owns the image manager dialog and all image-related interactions.
 */
export function EventHero() {
  const { eventId, isEditing, checklistRefsRef } = useEventEditor();
  const { carouselImages, updateImages } = useEventForm();
  const { collaborators, handleFieldFocus, handleFieldBlur } = useEventCollab();

  const thumbnailRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    checklistRefsRef.current.thumbnail = thumbnailRef;
  });

  const [managerOpen, setManagerOpen] = useState(false);

  return (
    <>
      <div
        ref={thumbnailRef}
        className="relative w-full"
        onFocus={() => handleFieldFocus("images")}
        onBlur={handleFieldBlur}
      >
        <CollaboratorBadge group="images" collaborators={collaborators} />
        <EventImageField onEditClick={() => setManagerOpen(true)} />
      </div>

      {isEditing && eventId && (
        <ImageManagerDialog
          open={managerOpen}
          onOpenChange={setManagerOpen}
          images={carouselImages}
          onConfirm={updateImages}
          eventId={eventId}
        />
      )}
    </>
  );
}
