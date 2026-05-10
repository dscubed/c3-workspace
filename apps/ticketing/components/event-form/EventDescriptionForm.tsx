import { EventDescriptionField } from "../events/fields";
import { useEventCollab } from "../events/shared/EventCollabContext";
import { useEventForm } from "../events/shared/EventFormContext";
import { CollaboratorBadge } from "./CollaboratorBadge";

export function EventDescriptionForm({}) {
  const { collaborators, getFieldLock, handleFieldFocus, clearFocus } =
    useEventCollab();
  const { markDirty } = useEventForm();

  return (
    <div className="relative">
      <CollaboratorBadge group="event" collaborators={collaborators} />
      <EventDescriptionField
        onFocusChange={(focused) => {
          if (focused) {
            handleFieldFocus("event");
            markDirty("event");
          } else {
            clearFocus();
          }
        }}
        locked={getFieldLock("event").locked}
        lockedBy={getFieldLock("event").lockedBy}
      />
    </div>
  );
}
