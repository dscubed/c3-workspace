import { Pencil } from "lucide-react";
import { EventDateField, EventLocationField } from ".";
import { EventDetailModal } from "../preview/EventDetailModal";
import { ResponsiveModal } from "../../ui/responsive-modal";
import { AttentionBadge } from "../../event-form/EventChecklist";
import { CollaboratorBadge } from "../../event-form/CollaboratorBadge";
import { CollaboratorPresence } from "@/lib/hooks/useEventRealtime";
import { useState } from "react";
import { DateLocationSection } from "../create/date-location/DateLocationSection";
import { cn } from "@/lib/utils";

interface EventDateLocationFieldProps {
  isEditing: boolean;
  collaborators: Map<string, CollaboratorPresence>;
  needsStartDate: boolean;
  needsLocation: boolean;
}

function DateLocationFieldButton({
  isEditing,
  onClick,
  children,
}: {
  isEditing: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-2 rounded-md px-2 py-1.5 -mx-2 text-left transition-colors hover:bg-muted/50",
        isEditing ? "cursor-default" : "cursor-pointer",
      )}
    >
      {children}
      <Pencil
        className={cn(
          "ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity",
          isEditing ? "group-hover:opacity-100" : "opacity-0",
        )}
      />
    </button>
  );
}

export function EventDateLocationField({
  isEditing,
  collaborators,
  needsStartDate,
  needsLocation,
}: EventDateLocationFieldProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      {isEditing && <AttentionBadge show={needsStartDate || needsLocation} />}
      <CollaboratorBadge group="location" collaborators={collaborators} />
      <div className="space-y-3">
        <DateLocationFieldButton
          isEditing={isEditing}
          onClick={() => setModalOpen(true)}
        >
          <EventDateField />
        </DateLocationFieldButton>
        <DateLocationFieldButton
          isEditing={isEditing}
          onClick={() => setModalOpen(true)}
        >
          <EventLocationField />
        </DateLocationFieldButton>
        {isEditing ? (
          <ResponsiveModal
            open={modalOpen}
            onOpenChange={setModalOpen}
            title="Date & location"
            className="max-w-lg"
          >
            <div className="overflow-y-auto max-h-[70vh] pr-1">
              <DateLocationSection />
            </div>
          </ResponsiveModal>
        ) : (
          <EventDetailModal open={modalOpen} onOpenChange={setModalOpen} />
        )}
      </div>
    </>
  );
}
