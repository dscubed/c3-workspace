"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { RegistrationWithEvent } from "@c3/types";

interface RegistrationDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registration: RegistrationWithEvent | null;
}

export function RegistrationDetailsDialog({
  open,
  onOpenChange,
  registration,
}: RegistrationDetailsDialogProps) {
  if (!registration) return null;

  const customFields = Object.entries(registration.custom_fields ?? {});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registration Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm font-medium text-muted-foreground">
            {registration.event_name}
          </p>
          <div className="rounded-lg border divide-y text-sm">
            <Row label="Name" value={`${registration.first_name} ${registration.last_name}`} />
            <Row label="Email" value={registration.email} />
            {registration.student_id && (
              <Row label="Student ID" value={registration.student_id} />
            )}
            {registration.course && (
              <Row label="Course" value={registration.course} />
            )}
            {customFields.map(([key, val]) => (
              <Row
                key={key}
                label={key
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase())}
                value={String(val)}
              />
            ))}
            <Row
              label="Status"
              value={registration.checked_in ? "Checked In" : "Not Checked In"}
            />
            <Row
              label="Registered"
              value={new Date(registration.created_at).toLocaleDateString(
                "en-AU",
                {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                },
              )}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 px-4 py-2.5">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
