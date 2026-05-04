"use client";

import { createContext, useContext, useCallback, useMemo } from "react";
import type {
  EventFormData,
  CarouselImage,
  ClubProfile,
  EventTheme,
  ThemeColors,
} from "./types";
import type { FieldGroup } from "@/lib/api/patchEvent";
import type { SectionData } from "@/components/events/sections/types";
import type { FetchedEventData } from "@/lib/api/fetchEvent";
import { useEventFormState } from "@/lib/hooks/useEventFormState";
import { useEventAutoSave } from "@/lib/hooks/useEventAutoSave";
import { useAuthStore } from "@c3/auth";
import { FIELD_TO_GROUP } from "@/lib/schemas/event";

export interface EventFormContextValue {
  /* ── Core form state ── */
  form: EventFormData;
  setForm: React.Dispatch<React.SetStateAction<EventFormData>>;
  updateField: <K extends keyof EventFormData>(
    key: K,
    value: EventFormData[K],
  ) => void;

  /* ── Images ── */
  carouselImages: CarouselImage[];
  updateImages: (images: CarouselImage[]) => void;
  /** Raw setter — only needed by collab for remote updates */
  setCarouselImages: React.Dispatch<React.SetStateAction<CarouselImage[]>>;

  /* ── Hosts ── */
  hostsData: ClubProfile[];
  setHostsData: React.Dispatch<React.SetStateAction<ClubProfile[]>>;

  /* ── Creator ── */
  creatorProfile: ClubProfile;

  /* ── Sections ── */
  sections: SectionData[];
  setSections: React.Dispatch<React.SetStateAction<SectionData[]>>;

  /* ── Theme ── */
  theme: EventTheme;
  /** Raw setter — also used by collab for remote theme updates */
  setTheme: (t: EventTheme) => void;
  colors: ThemeColors;
  isDark: boolean;
  accentGradient: string | undefined;

  /* ── Auto-save ── */
  markDirty: (...groups: FieldGroup[]) => void;
  flush: () => Promise<void>;
  /** Ref for collab to wire broadcast after saves */
  broadcastRef: React.MutableRefObject<(groups: FieldGroup[]) => void>;
  draftSaved: boolean;
  isAutoSaving: boolean;
  lastSavedAt: Date | null;
}

const EventFormContext = createContext<EventFormContextValue | null>(null);

export function useEventForm(): EventFormContextValue {
  const ctx = useContext(EventFormContext);
  if (!ctx) {
    throw new Error(
      "useEventForm must be used within <EventFormContext.Provider>",
    );
  }
  return ctx;
}

export { EventFormContext };

/* ── Provider ── */

interface EventFormDataProviderProps {
  data?: FetchedEventData;
  eventId?: string;
  isVisitorPreview?: boolean;
  children: React.ReactNode;
}

export function EventFormDataProvider({
  data,
  eventId,
  isVisitorPreview = false,
  children,
}: EventFormDataProviderProps) {
  const profile = useAuthStore((s) => s.profile);

  const {
    form,
    setForm,
    hostsData,
    setHostsData,
    sections,
    setSections,
    carouselImages,
    setCarouselImages,
    theme,
    setTheme: rawSetTheme,
    colors,
    isDark,
    accentGradient,
    formRef,
    carouselImagesRef,
    sectionsRef,
  } = useEventFormState({ data });

  const {
    markDirty,
    flush,
    isAutoSaving,
    draftSaved,
    lastSavedAt,
    broadcastRef,
  } = useEventAutoSave({
    eventId: isVisitorPreview ? undefined : eventId,
    formRef,
    carouselImagesRef,
    sectionsRef,
  });

  /* Stable setTheme that also marks dirty (for local edits) */
  const setTheme = useCallback(
    (t: EventTheme) => {
      rawSetTheme(t);
      markDirty("theme");
    },
    [rawSetTheme, markDirty],
  );

  const creatorProfile: ClubProfile = useMemo(
    () =>
      data?.creatorProfile ?? {
        id: profile?.id ?? "",
        first_name: profile?.first_name ?? "You",
        avatar_url: profile?.avatar_url ?? null,
      },
    [
      data?.creatorProfile,
      profile?.id,
      profile?.first_name,
      profile?.avatar_url,
    ],
  );

  const updateField = useCallback(
    <K extends keyof EventFormData>(key: K, value: EventFormData[K]) => {
      formRef.current = { ...formRef.current, [key]: value };
      setForm((prev) => ({ ...prev, [key]: value }));
      markDirty(FIELD_TO_GROUP[key]);
    },
    [formRef, setForm, markDirty],
  );

  const updateImages = useCallback(
    (updated: CarouselImage[]) => {
      setCarouselImages(updated);
      markDirty("images");
    },
    [setCarouselImages, markDirty],
  );

  const value: EventFormContextValue = useMemo(
    () => ({
      form,
      setForm,
      updateField,
      carouselImages,
      updateImages,
      setCarouselImages,
      hostsData,
      setHostsData,
      creatorProfile,
      sections,
      setSections,
      theme,
      setTheme,
      colors,
      isDark,
      accentGradient,
      markDirty,
      flush,
      broadcastRef,
      draftSaved,
      isAutoSaving,
      lastSavedAt,
    }),
    [
      form,
      setForm,
      updateField,
      carouselImages,
      updateImages,
      setCarouselImages,
      hostsData,
      setHostsData,
      creatorProfile,
      sections,
      setSections,
      theme,
      setTheme,
      colors,
      isDark,
      accentGradient,
      markDirty,
      flush,
      broadcastRef,
      draftSaved,
      isAutoSaving,
      lastSavedAt,
    ],
  );

  return (
    <EventFormContext.Provider value={value}>
      {children}
    </EventFormContext.Provider>
  );
}
