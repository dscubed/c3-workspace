"use client";

import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { SectionWrapper } from "@/components/events/preview/SectionWrapper";
import { TicketFieldCard } from "@/components/events/checkout/TicketFieldCard";
import { AddFieldButton } from "@/components/events/checkout/AddFieldButton";
import { CHECKOUT_PRESET_FIELDS } from "@/lib/types/ticketing";
import type { TicketingFieldDraft } from "@/lib/types/ticketing";
import { useCheckoutContext } from "./CheckoutContext";
import Link from "next/link";
import { Ticket } from "lucide-react";

function SortableFieldWrapper({
  id,
  children,
}: {
  id: string;
  children: (dragHandleProps: Record<string, unknown>) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

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

export function CheckoutEditor() {
  const {
    layout,
    isDark,
    colors,
    checkoutMode,
    pricingCount,
    fields,
    addField,
    updateField,
    removeField,
    dndSensors,
    fieldIds,
    handleFieldDragEnd,
    eventId,
  } = useCheckoutContext();

  if (checkoutMode === "registration") {
    return (
      <div className="mt-8 space-y-8">
        <SectionWrapper title="Checkout Info" layout={layout} isDark={isDark}>
          <div className="grid gap-4 sm:grid-cols-2">
            {CHECKOUT_PRESET_FIELDS.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label className={cn("text-sm font-medium", colors.text)}>
                  {field.label}
                  <span className="ml-0.5 text-red-500">*</span>
                </Label>
                <Input
                  type={field.type}
                  placeholder={field.label}
                  disabled
                  className={cn(
                    colors.inputBg,
                    colors.inputBorder,
                    colors.placeholder,
                  )}
                />
              </div>
            ))}
          </div>
          <p className={cn("mt-3 text-xs", colors.textMuted)}>
            These fields are preset and cannot be modified. They will always
            appear on the checkout form.
          </p>
        </SectionWrapper>

        <SectionWrapper title="Ticket Info" layout={layout} isDark={isDark}>
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
            <Link href={`/events/${eventId}/edit`}>
              <Button size="sm" variant="outline" className="mt-1 text-xs">
                Add ticket tiers
              </Button>
            </Link>
          </div>
        </SectionWrapper>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-8">
      <SectionWrapper title="Checkout Info" layout={layout} isDark={isDark}>
        <div className="grid gap-4 sm:grid-cols-2">
          {CHECKOUT_PRESET_FIELDS.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label className={cn("text-sm font-medium", colors.text)}>
                {field.label}
                <span className="ml-0.5 text-red-500">*</span>
              </Label>
              <Input
                type={field.type}
                placeholder={field.label}
                disabled
                className={cn(
                  colors.inputBg,
                  colors.inputBorder,
                  colors.placeholder,
                )}
              />
            </div>
          ))}
        </div>
        <p className={cn("mt-3 text-xs", colors.textMuted)}>
          These fields are preset and cannot be modified. They will always
          appear on the checkout form.
        </p>
      </SectionWrapper>

      <SectionWrapper title="Ticket Info" layout={layout} isDark={isDark}>
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
              <SortableContext
                items={fieldIds}
                strategy={verticalListSortingStrategy}
              >
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
    </div>
  );
}
