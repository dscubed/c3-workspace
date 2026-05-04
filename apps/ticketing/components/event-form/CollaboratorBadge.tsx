"use client";

import type { FieldGroup } from "@/lib/api/patchEvent";
import type { CollaboratorPresence } from "@/lib/hooks/useEventRealtime";

interface CollaboratorBadgeProps {
  group: FieldGroup;
  collaborators: Map<string, CollaboratorPresence>;
}

export function CollaboratorBadge({
  group,
  collaborators,
}: CollaboratorBadgeProps) {
  const editing = Array.from(collaborators.values()).filter(
    (c) => c.focusField === group,
  );
  if (editing.length === 0) return null;
  return (
    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-blue-500/90 px-2 py-0.5 text-[11px] font-medium text-white shadow-sm animate-in fade-in">
      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
      {editing.map((c) => c.name).join(", ")} editing…
    </span>
  );
}
