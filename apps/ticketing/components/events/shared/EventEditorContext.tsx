"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import type { EventTheme, ThemeColors } from "./types";
import type { ChecklistRefMap } from "@/components/event-form/EventChecklist";
import type { FieldGroup } from "@/lib/api/patchEvent";
import { useEventForm } from "./EventFormContext";
import { useEventPublish } from "@/lib/hooks/useEventPublish";

/* ── Context value ── */

export interface EventEditorContextValue {
  /* ── Identity ── */
  eventId: string | undefined;
  mode: "edit";
  initialUrlSlug: string | null;

  /* ── View ── */
  isVisitorPreview: boolean;
  previewMode: boolean;
  setPreviewMode: React.Dispatch<React.SetStateAction<boolean>>;
  viewMode: "edit" | "preview";
  isEditing: boolean;

  /* ── Theme ── */
  theme: EventTheme;
  setTheme: (t: EventTheme) => void;
  colors: ThemeColors;
  isDark: boolean;

  /* ── Auto-save status ── */
  isAutoSaving: boolean;
  lastSavedAt: Date | null;
  draftSaved: boolean;

  /* ── Derived flags ── */
  hasName: boolean;

  /* ── Event status ── */
  eventStatus: "draft" | "published" | "archived";
  savingPublish: boolean;

  /* ── Actions ── */
  handleBack: () => void;
  handlePublish: () => void;
  handleUnpublish: () => void;

  /* ── Cross-component refs ── */
  /** Registered by EventDetailsForm during render so TicketingButton can open pricing modal. */
  openPricingModalRef: React.MutableRefObject<() => void>;
  /** Populated by sub-components during render; EventChecklist reads for scroll-to. */
  checklistRefsRef: React.MutableRefObject<Partial<ChecklistRefMap>>;
}

const EventEditorContext = createContext<EventEditorContextValue | null>(null);

/** Read the event editor context. Throws if used outside a provider. */
export function useEventEditor(): EventEditorContextValue {
  const ctx = useContext(EventEditorContext);
  if (!ctx) {
    throw new Error(
      "useEventEditor must be used within an <EventEditorContext.Provider>",
    );
  }
  return ctx;
}

/**
 * Safe theme accessor — returns `null` when outside a provider (e.g. visitor pages).
 * Components use this to read ambient theme props with a prop fallback.
 */
export function useEditorTheme() {
  return useContext(EventEditorContext);
}

export { EventEditorContext };

/* ── Provider ── */

interface EventEditorProviderProps {
  eventId?: string;
  initialStatus?: "draft" | "published" | "archived";
  initialUrlSlug?: string | null;
  isVisitorPreview?: boolean;
  children: React.ReactNode;
}

export function EventEditorProvider({
  eventId,
  initialStatus = "draft",
  initialUrlSlug = null,
  isVisitorPreview = false,
  children,
}: EventEditorProviderProps) {
  const router = useRouter();
  const {
    form,
    carouselImages,
    sections,
    draftSaved,
    isAutoSaving,
    lastSavedAt,
    flush,
    broadcastRef,
    theme,
    setTheme,
    colors,
    isDark,
    accentGradient,
  } = useEventForm();

  const [previewMode, setPreviewMode] = useState(isVisitorPreview);
  const viewMode = previewMode ? "preview" : "edit";
  const isEditing = !previewMode;

  const openPricingModalRef = useRef<() => void>(() => {});
  const checklistRefsRef = useRef<Partial<ChecklistRefMap>>({});

  /** Stable broadcast wrapper that delegates to broadcastRef set by collab */
  const broadcast = useCallback(
    (groups: FieldGroup[]) => broadcastRef.current(groups),
    [broadcastRef],
  );

  const { eventStatus, savingPublish, handlePublish, handleUnpublish } =
    useEventPublish({
      eventId,
      form,
      carouselImages,
      sections,
      draftSaved,
      setDraftSaved: () => {},
      broadcast,
      initialStatus,
    });

  const handleBack = useCallback(async () => {
    await flush();
    router.back();
  }, [flush, router]);

  const value: EventEditorContextValue = useMemo(
    () => ({
      eventId,
      mode: "edit",
      initialUrlSlug,
      isVisitorPreview,
      previewMode,
      setPreviewMode,
      viewMode,
      isEditing,
      theme,
      setTheme,
      colors,
      isDark,
      hasName: !!form.name,
      isAutoSaving,
      lastSavedAt,
      draftSaved,
      eventStatus,
      savingPublish,
      handleBack,
      handlePublish,
      handleUnpublish,
      openPricingModalRef,
      checklistRefsRef,
    }),
    [
      eventId,
      initialUrlSlug,
      previewMode,
      viewMode,
      isEditing,
      theme,
      setTheme,
      colors,
      isDark,
      form.name,
      isAutoSaving,
      lastSavedAt,
      draftSaved,
      eventStatus,
      savingPublish,
      handleBack,
      handlePublish,
      handleUnpublish,
    ],
  );

  return (
    <EventEditorContext.Provider value={value}>
      {children}
    </EventEditorContext.Provider>
  );
}

/* ── Shared helper: relative "last saved" label ── */

function formatRelativeTime(date: Date): string {
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return "Saved just now";
  if (seconds < 60) return "Saved seconds ago";
  const minutes = Math.floor(seconds / 60);
  if (minutes === 1) return "Saved 1 min ago";
  if (minutes < 60) return `Saved ${minutes} mins ago`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "Saved 1 hr ago";
  if (hours < 24) return `Saved ${hours} hrs ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Saved 1 day ago";
  if (days < 7) return `Saved ${days} days ago`;
  return "Saved a while ago";
}

/** Ticking "Saved X ago" label — re-renders every 30 s. */
export function LastSavedLabel({ date }: { date: Date }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, [date]);

  void tick;
  return <>{formatRelativeTime(date)}</>;
}
