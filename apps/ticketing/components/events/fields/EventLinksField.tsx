"use client";

import { LinksPicker } from "../create/LinksPicker";
import { LinksDisplay } from "../preview/LinksDisplay";
import { useEventEditor } from "../shared/EventEditorContext";
import { useEventForm } from "../shared/EventFormContext";

export function EventLinksField() {
  const { viewMode: mode } = useEventEditor();
  const { form, updateField } = useEventForm();
  if (mode === "preview") return <LinksDisplay value={form.links} />;
  return (
    <LinksPicker value={form.links} onChange={(v) => updateField("links", v)} />
  );
}
