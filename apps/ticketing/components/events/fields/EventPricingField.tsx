"use client";

import { Tags } from "lucide-react";
import { PricingDisplay } from "../preview/PricingDisplay";
import { useEventEditor } from "../shared/EventEditorContext";
import { useEventForm } from "../shared/EventFormContext";
import { formatPricingLabel } from "../shared/pricingUtils";

export function EventPricingField() {
  const { viewMode, setPricingModalOpen } = useEventEditor();
  const { form } = useEventForm();

  if (viewMode === "preview") return <PricingDisplay value={form.pricing} />;

  return (
    <button
      type="button"
      onClick={() => setPricingModalOpen(true)}
      className="w-full group flex items-center gap-3 rounded-md transition-colors hover:bg-muted/60 -ml-2 px-2 py-1"
    >
      <Tags className="h-5 w-5 shrink-0 text-muted-foreground" />
      <span className="text-base text-muted-foreground group-hover:text-foreground transition-colors">
        {formatPricingLabel(form.pricing)}
      </span>
    </button>
  );
}
