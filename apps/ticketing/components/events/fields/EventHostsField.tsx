"use client";

import { HostsDialog } from "../create/hosts/HostsDialog";
import { HostsDisplay } from "../preview/HostsDisplay";
import { Users } from "lucide-react";
import { useEventEditor } from "../shared/EventEditorContext";
import { useEventForm } from "../shared/EventFormContext";

interface EventHostsFieldProps {
  /** Callback after invites are sent */
  onInvitesSent?: () => void;
}

export function EventHostsField({ onInvitesSent }: EventHostsFieldProps) {
  const { viewMode, eventId } = useEventEditor();
  const { form, updateField, hostsData, setHostsData, creatorProfile } =
    useEventForm();

  const value = { ids: form.hostIds, data: hostsData };

  if (viewMode === "preview") {
    return <HostsDisplay creatorProfile={creatorProfile} value={hostsData} />;
  }

  return (
    <div className="flex items-center gap-3">
      <Users className="h-5 w-5 shrink-0 text-muted-foreground" />
      <HostsDialog
        creatorProfile={creatorProfile}
        value={value}
        onChange={({ ids, data }) => {
          updateField("hostIds", ids);
          setHostsData(data);
        }}
        eventId={eventId}
        eventSaved={true}
        onInvitesSent={onInvitesSent}
      />
    </div>
  );
}
