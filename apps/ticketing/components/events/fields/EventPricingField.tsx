"use client";

import { PricingPicker } from "../create/PricingPicker";
import { PricingDisplay } from "../preview/PricingDisplay";
import { useEventEditor } from "../shared/EventEditorContext";
import { useEventForm } from "../shared/EventFormContext";

interface EventPricingFieldProps {
  onAfterSave?: () => void;
  modalOpen?: boolean;
  onModalOpenChange?: (open: boolean) => void;
}

export function EventPricingField({
  onAfterSave,
  modalOpen,
  onModalOpenChange,
}: EventPricingFieldProps) {
  const { viewMode: mode } = useEventEditor();
  const { form, updateField } = useEventForm();

  if (mode === "preview") return <PricingDisplay value={form.pricing} />;

  return (
    <PricingPicker
      value={form.pricing}
      onChange={(tiers) => updateField("pricing", tiers)}
      eventCapacity={form.eventCapacity}
      onEventCapacityChange={(cap) => updateField("eventCapacity", cap)}
      eventStartDate={form.occurrences[0]?.startDate}
      eventStartTime={form.occurrences[0]?.startTime}
      onAfterSave={onAfterSave}
      modalOpen={modalOpen}
      onModalOpenChange={onModalOpenChange}
    />
  );
}
