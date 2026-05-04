"use client";

import { useRef, useEffect } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";

import { useEventEditor } from "@/components/events/shared/EventEditorContext";
import { useEventForm } from "@/components/events/shared/EventFormContext";
import { useEventCollab } from "@/components/events/shared/EventCollabContext";
import {
  EventDescriptionField,
  EventSectionField,
} from "@/components/events/fields";
import { AttentionBadge } from "@/components/event-form/EventChecklist";
import {
  AddSectionButton,
  type SectionData,
  type FAQSectionData,
  type DragHandleProps,
} from "@/components/events/sections";
import type { FieldGroup } from "@/lib/api/patchEvent";
import { useEventSections } from "@/lib/hooks/useEventSections";
import { CollaboratorBadge } from "./CollaboratorBadge";
import { SortableSectionWrapper } from "./SortableSectionWrapper";

/**
 * The lower content area of an event: rich description followed by
 * drag-and-drop custom sections (FAQ, panelists, etc.).
 * Owns all section CRUD state and DnD logic.
 */
export function EventSectionsForm() {
  const { isEditing, theme, checklistRefsRef } = useEventEditor();
  const { sections, setSections, markDirty } = useEventForm();
  const { collaborators, getFieldLock, handleFieldFocus, clearFocus } =
    useEventCollab();

  const faqsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    checklistRefsRef.current.faqs = faqsRef;
  });

  const {
    addSection,
    updateSection,
    removeSection,
    sectionSensors,
    sectionIds,
    handleSectionDragEnd,
  } = useEventSections({ sections, setSections, markDirty });

  /* ── Derived FAQ attention state ── */
  const faqSection = sections.find((s) => s.type === "faq") as
    | FAQSectionData
    | undefined;
  const faqComplete =
    !!faqSection &&
    faqSection.items.filter((q) => q.question.trim() && q.answer.trim())
      .length >= 2;
  const needsFaqBadge = !faqComplete;
  const faqBadgeOnAddSection = needsFaqBadge && !faqSection;

  /* ── Section renderer ── */
  const renderSection = (
    section: SectionData,
    index: number,
    dragHandleProps?: DragHandleProps,
  ) => {
    const sectionGroup = `section:${section.type}` as FieldGroup;
    const sectionLock = getFieldLock(sectionGroup);
    return (
      <div
        ref={section.type === "faq" ? faqsRef : undefined}
        className="relative mt-8"
      >
        <CollaboratorBadge group={sectionGroup} collaborators={collaborators} />
        {isEditing && section.type === "faq" && needsFaqBadge && (
          <AttentionBadge show />
        )}
        <EventSectionField
          section={section}
          index={index}
          dragHandleProps={dragHandleProps}
          onChange={updateSection}
          onRemove={removeSection}
          onFocusChange={(focused) => {
            if (focused) {
              handleFieldFocus(sectionGroup);
              markDirty(sectionGroup);
            } else {
              clearFocus();
            }
          }}
          locked={sectionLock.locked}
          lockedBy={sectionLock.lockedBy}
        />
      </div>
    );
  };

  return (
    <div
      className={cn(theme.layout === "classic" ? "space-y-10" : "space-y-6")}
    >
      {/* Description */}
      <div className="relative">
        <CollaboratorBadge group="event" collaborators={collaborators} />
        <EventDescriptionField
          onFocusChange={(focused) => {
            if (focused) {
              handleFieldFocus("event");
              markDirty("event");
            } else {
              clearFocus();
            }
          }}
          locked={getFieldLock("event").locked}
          lockedBy={getFieldLock("event").lockedBy}
        />
      </div>

      {/* Sections */}
      <div>
        {isEditing ? (
          <DndContext
            sensors={sectionSensors}
            collisionDetection={closestCenter}
            onDragEnd={handleSectionDragEnd}
          >
            <SortableContext
              items={sectionIds}
              strategy={verticalListSortingStrategy}
            >
              {sections.map((section, i) => (
                <SortableSectionWrapper key={section.type} id={section.type}>
                  {(dragHandleProps) =>
                    renderSection(section, i, dragHandleProps)
                  }
                </SortableSectionWrapper>
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          sections.map((section, i) => (
            <div key={section.type}>{renderSection(section, i)}</div>
          ))
        )}

        {isEditing && (
          <div ref={!faqSection ? faqsRef : undefined}>
            <AddSectionButton
              activeSections={sections.map((s) => s.type)}
              onAdd={addSection}
              showAttentionBadge={faqBadgeOnAddSection}
            />
          </div>
        )}
      </div>
    </div>
  );
}
