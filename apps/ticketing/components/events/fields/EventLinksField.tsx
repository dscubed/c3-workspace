"use client";

import { LinksPicker } from "../create/pricing/LinksPicker";
import { LinksDisplay } from "../preview/LinksDisplay";
import { useEventEditor } from "../shared/EventEditorContext";
import { useEventForm } from "../shared/EventFormContext";

export function EventLinksField() {
  const { viewMode } = useEventEditor();
  const { form, updateField } = useEventForm();
  if (viewMode === "preview") return <LinksDisplay value={form.links} />;
  return (
    <LinksPicker value={form.links} onChange={(v) => updateField("links", v)} />
  );
}
