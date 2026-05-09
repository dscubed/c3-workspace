"use client";

import { createContext, useContext, useCallback, useMemo } from "react";
import type { FieldGroup } from "@/lib/api/patchEvent";
import type { CollaboratorPresence } from "@/lib/hooks/useEventRealtime";
import type { EventTheme } from "./types";
import { useEventCollaboration } from "@/lib/hooks/useEventCollaboration";
import { useEventForm } from "./EventFormContext";
import { useAuthStore } from "@c3/auth";

export interface EventCollabContextValue {
  collaborators: Map<string, CollaboratorPresence>;
  getFieldLock: (group: FieldGroup) => { locked: boolean; lockedBy?: string };
  handleFieldFocus: (field: FieldGroup) => void;
  handleFieldBlur: (e: React.FocusEvent<HTMLDivElement>) => void;
  /** Clear the focused-field ref and broadcast null presence. Call on rich-editor blur. */
  clearFocus: () => void;
}

const EventCollabContext = createContext<EventCollabContextValue | null>(null);

export function useEventCollab(): EventCollabContextValue {
  const ctx = useContext(EventCollabContext);
  if (!ctx) {
    throw new Error(
      "useEventCollab must be used within <EventCollabContext.Provider>",
    );
  }
  return ctx;
}

export { EventCollabContext };

/* ── Provider ── */

interface EventCollabProviderProps {
  eventId?: string;
  isVisitorPreview?: boolean;
  children: React.ReactNode;
}

export function EventCollabProvider({
  eventId,
  isVisitorPreview = false,
  children,
}: EventCollabProviderProps) {
  const profile = useAuthStore((s) => s.profile);
  const {
    setForm,
    setCarouselImages,
    setHostsData,
    setSections,
    broadcastRef,
  } = useEventForm();

  /* Remote theme updates must NOT call markDirty — construct directly from setForm */
  const setThemeForCollab = useCallback(
    (t: EventTheme) => setForm((prev) => ({ ...prev, theme: t })),
    [setForm],
  );

  const {
    broadcastFocus,
    collaborators,
    focusedFieldRef,
    handleFieldFocus,
    handleFieldBlur,
    getFieldLock,
  } = useEventCollaboration({
    eventId,
    userId: profile?.id,
    userName: profile?.first_name ?? undefined,
    enabled: !isVisitorPreview,
    broadcastRef,
    setForm,
    setCarouselImages,
    setHostsData,
    setTheme: setThemeForCollab,
    setSections,
  });

  const clearFocus = useCallback(() => {
    focusedFieldRef.current = null;
    broadcastFocus(null);
  }, [focusedFieldRef, broadcastFocus]);

  const value: EventCollabContextValue = useMemo(
    () => ({
      collaborators,
      getFieldLock,
      handleFieldFocus,
      handleFieldBlur,
      clearFocus,
    }),
    [
      collaborators,
      getFieldLock,
      handleFieldFocus,
      handleFieldBlur,
      clearFocus,
    ],
  );

  return (
    <EventCollabContext.Provider value={value}>
      {children}
    </EventCollabContext.Provider>
  );
}
