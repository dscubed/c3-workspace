"use client";

import { SectionWrapper } from "@/components/events/preview/SectionWrapper";
import { getPresetFields } from "@/lib/types/ticketing";
import { useCheckoutContext } from "./CheckoutContext";
import { AutofillButton } from "./AutofillButton";
import { PresetField } from "./PresetField";

interface TicketFormProps {
  ticketIndex: number;
}

export function TicketForm({ ticketIndex }: TicketFormProps) {
  const { layout, isDark, colors, getFieldValue, setFieldValue, clubName, isEditing } =
    useCheckoutContext();

  const presetFields = getPresetFields(clubName);

  return (
    <SectionWrapper
      title="Your Details"
      layout={layout}
      isDark={isDark}
      headerRight={<AutofillButton ticketIndex={ticketIndex} />}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {presetFields.map((field) => (
          <PresetField
            key={field.key}
            field={field}
            value={getFieldValue(ticketIndex, field.key)}
            onChange={(val) => setFieldValue(ticketIndex, field.key, val)}
            isDark={isDark}
            colors={colors}
            disabled={isEditing}
          />
        ))}
      </div>
    </SectionWrapper>
  );
}
