import { EventPreviewHeader } from "../events/preview/EventPreviewHeader";
import { EditorToolbox } from "../events/shared/EditorToolbox";
import { useEventEditor } from "../events/shared/EventEditorContext";

export function EventFormHeader() {
  const { isVisitorPreview } = useEventEditor();

  return <>{isVisitorPreview ? <EventPreviewHeader /> : <EditorToolbox />}</>;
}
