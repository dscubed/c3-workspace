"use client";

import { TagsPicker } from "../create/TagsPicker";
import { TagsDisplay } from "../preview/category-tags/TagsDisplay";
import { useEventEditor } from "../shared/EventEditorContext";
import { useEventForm } from "../shared/EventFormContext";

export function EventTagsField() {
  const { viewMode: mode } = useEventEditor();
  const { form, updateField } = useEventForm();
  if (mode === "preview") return <TagsDisplay value={form.tags} />;
  return (
    <TagsPicker value={form.tags} onChange={(v) => updateField("tags", v)} />
  );
}
