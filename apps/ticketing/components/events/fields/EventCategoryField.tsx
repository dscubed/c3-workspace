"use client";

import { CategoryPicker } from "../create/CategoryPicker";
import { CategoryDisplay } from "../preview/CategoryDisplay";
import { useEventEditor } from "../shared/EventEditorContext";
import { useEventForm } from "../shared/EventFormContext";

export function EventCategoryField() {
  const { viewMode: mode } = useEventEditor();
  const { form, updateField } = useEventForm();
  if (mode === "preview") return <CategoryDisplay value={form.category} />;
  return (
    <CategoryPicker
      value={form.category}
      onChange={(v) => updateField("category", v)}
    />
  );
}
