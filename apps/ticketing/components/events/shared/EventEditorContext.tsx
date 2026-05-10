"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
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

  /* ── Derived flags ── */
  hasName: boolean;

  /* ── Event status ── */
  eventStatus: "draft" | "published" | "archived";
  savingPublish: boolean;

  /* ── Actions ── */
  handleBack: () => void;
  handlePublish: () => void;
  handleUnpublish: () => void;

  /* ── Pricing modal ── */
  pricingModalOpen: boolean;
  setPricingModalOpen: React.Dispatch<React.SetStateAction<boolean>>;

  /* ── Cross-component refs ── */
  /** Populated by sub-components during render; EventChecklist reads for scroll-to. */
  checklistRefsRef: RefObject<Partial<ChecklistRefMap>>;
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
    isAutoSaving,
    lastSavedAt,
    flush,
    broadcastRef,
    theme,
    setTheme,
    colors,
    isDark,
  } = useEventForm();

  const [previewMode, setPreviewMode] = useState(isVisitorPreview);
  const viewMode = previewMode ? "preview" : "edit";
  const isEditing = !previewMode;

  const [pricingModalOpen, setPricingModalOpen] = useState(false);
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
      broadcast,
      initialStatus,
    });

  const handleBack = useCallback(async () => {
    await flush();
    router.back();
  }, [flush, router]);

  const value: EventEditorContextValue = {
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
      eventStatus,
      savingPublish,
      handleBack,
      handlePublish,
      handleUnpublish,
      pricingModalOpen,
      setPricingModalOpen,
      checklistRefsRef,
    };

  return (
    <EventEditorContext.Provider value={value}>
      {children}
    </EventEditorContext.Provider>
  );
}
