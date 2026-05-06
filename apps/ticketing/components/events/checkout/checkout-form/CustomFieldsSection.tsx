"use client";

import { Ticket } from "lucide-react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SectionWrapper } from "@/components/events/preview/SectionWrapper";
import { TicketFieldCard } from "@/components/events/checkout/TicketFieldCard";
import { TicketFieldPreview } from "@/components/events/checkout/TicketFieldPreview";
import { AddFieldButton } from "@/components/events/checkout/AddFieldButton";
import type { TicketingFieldDraft } from "@/lib/types/ticketing";
import { useCheckoutContext } from "./CheckoutContext";
import { useAttendeeTabs } from "./useAttendeeTabs";

function SortableFieldWrapper({
  id,
  children,
}: {
  id: string;
  children: (dragHandleProps: Record<string, unknown>) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      {children({ ...attributes, ...listeners })}
    </div>
  );
}

export function CustomFieldsSection() {
  const {
    isEditing,
    pricingCount,
    fields,
    addField,
    updateField,
    removeField,
    dndSensors,
    fieldIds,
    handleFieldDragEnd,
    colors,
    layout,
    isDark,
    openPricingModal,
    getFieldValue,
    setFieldValue,
  } = useCheckoutContext();
  const { safeIndex } = useAttendeeTabs();

  // Preview + no tiers or no custom fields: render nothing
  if (!isEditing && (pricingCount === 0 || fields.length === 0)) return null;

  // Edit + no tiers: prompt to add tiers
  if (isEditing && pricingCount === 0) {
    return (
      <SectionWrapper title="Custom Fields" layout={layout} isDark={isDark}>
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div
            className={cn(
              "rounded-full p-3",
              isDark ? "bg-white/10" : "bg-muted",
            )}
          >
            <Ticket className={cn("h-5 w-5", colors.textMuted)} />
          </div>
          <div className="space-y-1">
            <p className={cn("text-sm font-medium", colors.text)}>
              No ticket tiers yet
            </p>
            <p className={cn("text-xs", colors.textMuted)}>
              Add ticket tiers to configure custom checkout fields.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="mt-1 text-xs"
            onClick={openPricingModal}
          >
            Add ticket tiers
          </Button>
        </div>
      </SectionWrapper>
    );
  }

  // Edit + tiers configured: DnD field editor
  if (isEditing) {
    return (
      <SectionWrapper title="Custom Fields" layout={layout} isDark={isDark}>
        <p className={cn("mb-3 text-xs", colors.textMuted)}>
          Add custom questions for attendees. Drag to reorder.
        </p>
        <div className="space-y-2">
          {fields.length > 0 ? (
            <DndContext
              sensors={dndSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleFieldDragEnd}
            >
              <SortableContext items={fieldIds} strategy={verticalListSortingStrategy}>
                {fields.map((field: TicketingFieldDraft, i: number) => (
                  <SortableFieldWrapper key={field.id} id={field.id}>
                    {(dragHandleProps) => (
                      <TicketFieldCard
                        field={field}
                        index={i}
                        colors={colors}
                        onChange={(updated) => updateField(field.id, updated)}
                        onRemove={() => removeField(field.id)}
                        dragHandleProps={dragHandleProps}
                      />
                    )}
                  </SortableFieldWrapper>
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <p className={cn("text-sm", colors.textMuted)}>
                No custom fields yet. Add one below.
              </p>
            </div>
          )}
          <AddFieldButton onAdd={addField} colors={colors} />
        </div>
      </SectionWrapper>
    );
  }

  // Preview + tiers + fields: read-only previews
  return (
    <SectionWrapper title="Additional Info" layout={layout} isDark={isDark}>
      <div className="space-y-4">
        {fields.map((field) => (
          <TicketFieldPreview
            key={field.id}
            field={field}
            colors={colors}
            value={getFieldValue(safeIndex, field.id)}
            onChange={(val) => setFieldValue(safeIndex, field.id, val)}
          />
        ))}
      </div>
    </SectionWrapper>
  );
}
